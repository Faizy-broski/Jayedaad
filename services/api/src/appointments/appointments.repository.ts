import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

export type AppointmentStatus = 'requested' | 'confirmed' | 'completed' | 'cancelled';

// Exactly one of these is ever set — an agent's own appointment, or an
// individual owner's own appointment (owner-posted listings have no agent).
export interface AppointmentSubject {
  agentId?: string;
  ownerId?: string;
}

const APPOINTMENT_COLUMNS = 'id, agent_id, owner_id, lead_id, listing_id, title, scheduled_at, duration_minutes, status, notes, created_at';

function mapRow(row: any) {
  return {
    id: row.id,
    agentId: row.agent_id,
    ownerId: row.owner_id,
    leadId: row.lead_id,
    listingId: row.listing_id,
    title: row.title,
    scheduledAt: row.scheduled_at,
    durationMinutes: row.duration_minutes,
    status: row.status as AppointmentStatus,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly supabase: SupabaseService) {}

  // Used both by AppointmentsController (an agent/owner scheduling their own
  // appointment) and by LeadsRepository (Book a Visit auto-creating a
  // 'requested' one) — subject is always resolved by the caller, never
  // trusted from the request body.
  async create(subject: AppointmentSubject, input: CreateAppointmentDto) {
    const { data, error } = await this.supabase.client
      .from('appointments')
      .insert({
        agent_id: subject.agentId ?? null,
        owner_id: subject.ownerId ?? null,
        lead_id: input.leadId ?? null,
        listing_id: input.listingId ?? null,
        title: input.title,
        scheduled_at: input.scheduledAt,
        duration_minutes: input.durationMinutes ?? 30,
        status: input.status ?? 'requested',
        notes: input.notes ?? null,
      })
      .select(APPOINTMENT_COLUMNS)
      .single();
    if (error) throw error;
    return mapRow(data);
  }

  async list(subject: AppointmentSubject, range: { from?: string; to?: string } = {}) {
    let query = this.supabase.client.from('appointments').select(APPOINTMENT_COLUMNS).order('scheduled_at', { ascending: true });
    query = subject.agentId ? query.eq('agent_id', subject.agentId) : query.eq('owner_id', subject.ownerId);
    if (range.from) query = query.gte('scheduled_at', range.from);
    if (range.to) query = query.lte('scheduled_at', range.to);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(mapRow);
  }

  async findSubject(appointmentId: string): Promise<AppointmentSubject | null> {
    const { data, error } = await this.supabase.client
      .from('appointments')
      .select('agent_id, owner_id')
      .eq('id', appointmentId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { agentId: data.agent_id ?? undefined, ownerId: data.owner_id ?? undefined };
  }

  async update(appointmentId: string, input: UpdateAppointmentDto) {
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.scheduledAt !== undefined) patch.scheduled_at = input.scheduledAt;
    if (input.durationMinutes !== undefined) patch.duration_minutes = input.durationMinutes;
    if (input.notes !== undefined) patch.notes = input.notes;
    if (input.status !== undefined) patch.status = input.status;

    const { data, error } = await this.supabase.client
      .from('appointments')
      .update(patch)
      .eq('id', appointmentId)
      .select(APPOINTMENT_COLUMNS)
      .single();
    if (error) throw error;
    return mapRow(data);
  }

  async remove(appointmentId: string) {
    const { error } = await this.supabase.client.from('appointments').delete().eq('id', appointmentId);
    if (error) throw error;
  }
}
