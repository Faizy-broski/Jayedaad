import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { NotificationsRepository } from '../notifications/notifications.repository';
import { Role } from '../common/types';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { UpdateSupportTicketStatusDto } from './dto/update-support-ticket-status.dto';
import { paginate, PaginationParams, resolvePagination } from '../common/pagination';

const SUPPORT_TICKET_COLUMNS =
  'id, created_by, agency_id, subject, message, status, admin_note, assigned_to, created_at, updated_at';

const STATUS_TITLE: Record<'open' | 'in_progress' | 'resolved', string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

// Agent-facing help desk (apps/web /help) — an authenticated agent submits
// an issue, every super_admin gets notified (same notifySuperAdmins pattern
// leads.repository.ts uses for an unassigned lead), and Super Admin tracks
// it to resolution from /admin/support. Deliberately its own table, not
// contact_messages (see 0043_support_tickets.sql's header comment).
@Injectable()
export class SupportRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly notifications: NotificationsRepository,
  ) {}

  async create(userId: string, agentId: string | undefined, input: CreateSupportTicketDto) {
    // Denormalized display-only field — resolved from the submitter's own
    // agent_profiles row, not trusted from client input.
    let agencyId: string | null = null;
    if (agentId) {
      const { data: agent, error: agentError } = await this.supabase.client
        .from('agent_profiles')
        .select('agency_id')
        .eq('id', agentId)
        .maybeSingle();
      if (agentError) throw agentError;
      agencyId = agent?.agency_id ?? null;
    }

    const { data, error } = await this.supabase.client
      .from('support_tickets')
      .insert({
        created_by: userId,
        agency_id: agencyId,
        subject: input.subject,
        message: input.message,
      })
      .select(SUPPORT_TICKET_COLUMNS)
      .single();
    if (error) throw error;

    await this.notifySuperAdmins(input.subject);
    return data;
  }

  async listMine(userId: string, filters: PaginationParams = {}) {
    const pagination = resolvePagination(filters);
    const query = this.supabase.client
      .from('support_tickets')
      .select(SUPPORT_TICKET_COLUMNS, { count: 'exact' })
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .range(pagination.from, pagination.to);

    return paginate(query, pagination);
  }

  // Super Admin-only (enforced at the controller). assignedTo lets the
  // Super Admin support page filter down to "tickets assigned to staff X"
  // — the "see the status of tickets assigned" half of the feature —
  // alongside the existing status filter.
  async listAll(filters: PaginationParams & { status?: 'open' | 'in_progress' | 'resolved'; assignedTo?: string } = {}) {
    const pagination = resolvePagination(filters);
    let query = this.supabase.client
      .from('support_tickets')
      .select(SUPPORT_TICKET_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo);
    query = query.range(pagination.from, pagination.to);

    return paginate(query, pagination);
  }

  // verification_staff-only (enforced at the controller) — the "assigned
  // to me" queue, same shape as listMine() but keyed on assigned_to instead
  // of created_by.
  async listAssigned(staffId: string, filters: PaginationParams & { status?: 'open' | 'in_progress' | 'resolved' } = {}) {
    const pagination = resolvePagination(filters);
    let query = this.supabase.client
      .from('support_tickets')
      .select(SUPPORT_TICKET_COLUMNS, { count: 'exact' })
      .eq('assigned_to', staffId)
      .order('created_at', { ascending: false });

    if (filters.status) query = query.eq('status', filters.status);
    query = query.range(pagination.from, pagination.to);

    return paginate(query, pagination);
  }

  // Super Admin-only (enforced at the controller). staffId's eligibility is
  // validated here, not trusted from the client — mirrors this codebase's
  // standing "never trust a client-supplied id for a role-sensitive
  // assignment" discipline (e.g. subscription-tiers.repository.ts's
  // poster_type eligibility check).
  async assign(id: string, staffId: string) {
    const { data: staffProfile, error: staffError } = await this.supabase.client
      .from('profiles')
      .select('role')
      .eq('id', staffId)
      .maybeSingle();
    if (staffError) throw staffError;
    if (!staffProfile || staffProfile.role !== 'verification_staff') {
      throw new BadRequestException('You can only assign tickets to a verification staff member.');
    }

    const { data, error } = await this.supabase.client
      .from('support_tickets')
      .update({ assigned_to: staffId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(SUPPORT_TICKET_COLUMNS)
      .single();
    if (error) throw error;

    await this.notifyAssignee(staffId, data.subject);
    return data;
  }

  // Same best-effort discipline as notifySuperAdmins/notifyOwner below —
  // lets a verification_staff member know a ticket landed in their queue
  // without waiting for them to stumble onto it.
  private async notifyAssignee(staffId: string, subject: string): Promise<void> {
    try {
      await this.notifications.create({
        userId: staffId,
        type: 'support_ticket',
        title: 'A support ticket was assigned to you',
        body: subject,
      });
    } catch {
      // non-fatal
    }
  }

  // Agent-facing edit — only while the ticket is still 'open'. Once Super
  // Admin has moved it to in_progress/resolved, the submitter can no longer
  // change what they asked (the admin is already acting on the original
  // wording) — matches the "no reply thread" scope: editing after the fact
  // would be a backdoor way to have a conversation on the ticket.
  async updateOwn(userId: string, id: string, input: UpdateSupportTicketDto) {
    await this.assertOwnOpenTicket(userId, id);

    const { data, error } = await this.supabase.client
      .from('support_tickets')
      .update({ subject: input.subject, message: input.message, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(SUPPORT_TICKET_COLUMNS)
      .single();
    if (error) throw error;
    return data;
  }

  // Shared by both the agent (own + still-open only, same gate as
  // updateOwn) and super_admin (any ticket, any status — a full help-desk
  // "remove this from the queue" action, not subject to the submitter's
  // own edit window).
  async remove(userId: string, role: Role, id: string): Promise<void> {
    if (role !== 'super_admin') await this.assertOwnOpenTicket(userId, id);

    const { error } = await this.supabase.client.from('support_tickets').delete().eq('id', id);
    if (error) throw error;
  }

  private async assertOwnOpenTicket(userId: string, id: string): Promise<void> {
    const { data: ticket, error } = await this.supabase.client
      .from('support_tickets')
      .select('created_by, status')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!ticket) throw new NotFoundException('Ticket not found.');
    if (ticket.created_by !== userId) throw new ForbiddenException('You can only edit your own tickets.');
    if (ticket.status !== 'open') {
      throw new BadRequestException('This ticket has already been reviewed and can no longer be edited.');
    }
  }

  // Super Admin-only (enforced at the controller). Status-only lifecycle —
  // no reply thread, per the confirmed scope.
  async updateStatus(id: string, input: UpdateSupportTicketStatusDto) {
    const { data, error } = await this.supabase.client
      .from('support_tickets')
      .update({ status: input.status, admin_note: input.adminNote, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(SUPPORT_TICKET_COLUMNS)
      .single();
    if (error) throw error;

    await this.notifyOwner(data.created_by, data.subject, input.status);
    return data;
  }

  // The one-way half of this ticket system — notifySuperAdmins() above
  // tells staff about a new ticket, but nothing told the submitter their
  // ticket was updated; they only found out by revisiting /help. Mirrors
  // notifySuperAdmins' shape exactly, just a single recipient.
  private async notifyOwner(userId: string, subject: string, status: 'open' | 'in_progress' | 'resolved'): Promise<void> {
    try {
      await this.notifications.create({
        userId,
        type: 'support_ticket',
        title: `Your ticket was updated: ${STATUS_TITLE[status]}`,
        body: subject,
      });
    } catch {
      // Best-effort, same discipline as notifySuperAdmins — a notification
      // failure must never fail the status update itself.
    }
  }

  // Mirrors leads.repository.ts's private notifySuperAdmins() exactly —
  // query profiles where role = 'super_admin', loop-insert one notification
  // row per admin. Best-effort: a notification failure must never fail the
  // ticket submission itself.
  private async notifySuperAdmins(subject: string): Promise<void> {
    try {
      const { data: admins, error } = await this.supabase.client.from('profiles').select('id').eq('role', 'super_admin');
      if (error || !admins) return;
      await Promise.all(
        admins.map((admin: any) =>
          this.notifications.create({
            userId: admin.id,
            type: 'support_ticket',
            title: 'New support ticket',
            body: subject,
          }),
        ),
      );
    } catch {
      // Best-effort, same discipline as leads.repository.ts's notify* helpers
      // — a notification failure must never fail the ticket submission itself.
    }
  }
}
