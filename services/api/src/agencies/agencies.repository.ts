import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { RegisterAgencyDto } from './dto/register-agency.dto';
import { DocumentsService } from '../documents/documents.service';
import { AgentsRepository } from '../agents/agents.repository';
import { NotificationsRepository } from '../notifications/notifications.repository';

const AGENCY_COLUMNS =
  'id, name, slug, logo_url, description, phone, email, city, address, business_hours, verification_status, rejection_reason, sales_associate_count, tier, default_commission_rate';

export type AgencyTier = 'titanium' | 'featured' | 'basic';

// Confirmed shape for the public Agents directory (apps/web /agents):
// Titanium/Featured tiers plus Property Type/City/Company-name search, all
// server-side/paginated — mirrors ProjectSearchFilters in
// projects/projects.repository.ts.
export interface AgencySearchFilters {
  city?: string;
  location?: string; // free-text match against the agency's street address, distinct from city
  tier?: AgencyTier;
  propertyTypeSlug?: string;
  search?: string; // company/agency name
  page?: number;
  pageSize?: number;
}

export interface PaginatedAgencies {
  items: (ReturnType<typeof mapAgencyStatsRow>)[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

function mapAgencyStatsRow(row: any, stats: { forSaleCount: number; forRentCount: number }) {
  return { ...row, forSaleCount: stats.forSaleCount, forRentCount: stats.forRentCount };
}

// PostgREST's .or()/.ilike() are a small DSL — strip characters that are
// syntactically significant in it rather than interpolate a raw user string
// (same discipline as listings.repository.ts::sanitizeKeyword and
// projects.repository.ts::sanitizeKeyword).
function sanitizeKeyword(keyword: string): string {
  return keyword.replace(/[,()%]/g, ' ').trim();
}

export type OnboardingDocumentType = 'company_registration' | 'owner_id_card' | 'tax_certificate';

// Real business requirement: Owner ID + Company Registration ID are
// mandatory to onboard a company/agency — same literal list used for
// independent agents (agents.repository.ts), since an agency-affiliated
// agent is covered by their agency's own documents. tax_certificate stays a
// valid OnboardingDocumentType (optional upload) but is no longer required
// for the verification gate.
export const REQUIRED_ONBOARDING_DOCUMENT_TYPES: OnboardingDocumentType[] = ['company_registration', 'owner_id_card'];

// Zameen.com distinguishes an Agency (company) from an individual Agent, who
// may belong to one or work independently — agent_profiles.agency_id is
// nullable. Aggregate stats (listing counts, views) are deliberately NOT
// stored here — computed at query time, matching the single-source-of-truth
// principle already established for view counts [Reqs §4.3].
@Injectable()
export class AgenciesRepository {
  private readonly logger = new Logger(AgenciesRepository.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly documents: DocumentsService,
    private readonly agents: AgentsRepository,
    private readonly notifications: NotificationsRepository,
  ) {}

  // Agency Admin's "full visibility to their overall performance, analytics,
  // and their sales associates" (Document Verification Phase 3) — reuses
  // AgentsRepository.getStats/getAnalytics per associate rather than a new
  // SQL aggregate, so this always matches what each associate sees on their
  // own dashboard. Closings (leads.status = 'closed') queried directly since
  // AgentsRepository has no equivalent method.
  async getStaffAnalytics(agencyId: string) {
    const staff = await this.listStaff(agencyId);

    const associates = await Promise.all(
      staff.map(async (member) => {
        const [stats, analytics, { count: closingsCount, error: closingsError }] = await Promise.all([
          this.agents.getStats(member.id),
          this.agents.getAnalytics(member.id),
          this.supabase.client
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('agent_id', member.id)
            .eq('status', 'closed'),
        ]);
        if (closingsError) throw closingsError;

        return {
          agentId: member.id,
          displayName: member.displayName,
          isAgencyAdmin: member.isAgencyAdmin,
          stats,
          analytics,
          closingsCount: closingsCount ?? 0,
        };
      }),
    );

    const totals = associates.reduce(
      (acc, a) => ({
        forSaleCount: acc.forSaleCount + a.stats.forSaleCount,
        forRentCount: acc.forRentCount + a.stats.forRentCount,
        leads: acc.leads + a.analytics.leads,
        views: acc.views + a.analytics.views,
        closingsCount: acc.closingsCount + a.closingsCount,
      }),
      { forSaleCount: 0, forRentCount: 0, leads: 0, views: 0, closingsCount: 0 },
    );

    return { associates, totals };
  }

  async list(filters: { city?: string } = {}) {
    let query = this.supabase.client
      .from('agencies')
      .select(AGENCY_COLUMNS)
      .eq('verification_status', 'verified')
      .order('name', { ascending: true });

    if (filters.city) query = query.eq('city', filters.city);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Public Agents directory (apps/web /agents) — Titanium/Featured tier
  // strips plus the full paginated/searchable grid, with "X for Sale | Y for
  // Rent" computed per-agency in one batched pass (getStatsForAgencies)
  // rather than N+1 calls to getStats() per card.
  async searchPublic(filters: AgencySearchFilters = {}): Promise<PaginatedAgencies> {
    const page = filters.page && filters.page > 0 ? Math.floor(filters.page) : 1;
    const pageSize = Math.min(
      filters.pageSize && filters.pageSize > 0 ? Math.floor(filters.pageSize) : DEFAULT_PAGE_SIZE,
      MAX_PAGE_SIZE,
    );

    // propertyTypeSlug filters on the agency's *inventory* (does this agency
    // have any verified listing of this type), not a column on agencies
    // itself — resolved as a pre-lookup of eligible agency ids, same pattern
    // as projects.repository.ts's needsUnitTypeLookup.
    let eligibleAgencyIds: string[] | undefined;
    if (filters.propertyTypeSlug) {
      const { data: listingRows, error: listingError } = await this.supabase.client
        .from('listings')
        .select('agent_id, property_types!inner (slug)')
        .eq('status', 'verified')
        .eq('property_types.slug', filters.propertyTypeSlug);
      if (listingError) throw listingError;

      const agentIds = Array.from(new Set((listingRows ?? []).map((r: any) => r.agent_id).filter(Boolean)));
      if (agentIds.length === 0) return { items: [], total: 0, page, pageSize };

      const { data: agentProfileRows, error: agentProfileError } = await this.supabase.client
        .from('agent_profiles')
        .select('agency_id')
        .in('id', agentIds);
      if (agentProfileError) throw agentProfileError;

      eligibleAgencyIds = Array.from(
        new Set((agentProfileRows ?? []).map((r: any) => r.agency_id).filter(Boolean)),
      );
      if (eligibleAgencyIds.length === 0) return { items: [], total: 0, page, pageSize };
    }

    let query = this.supabase.client
      .from('agencies')
      .select(AGENCY_COLUMNS, { count: 'exact' })
      .eq('verification_status', 'verified');

    if (filters.city) query = query.eq('city', filters.city);
    if (filters.tier) query = query.eq('tier', filters.tier);
    if (filters.search) {
      const term = sanitizeKeyword(filters.search);
      if (term) query = query.ilike('name', `%${term}%`);
    }
    if (filters.location) {
      const term = sanitizeKeyword(filters.location);
      if (term) query = query.ilike('address', `%${term}%`);
    }
    if (eligibleAgencyIds) query = query.in('id', eligibleAgencyIds);

    query = query.order('name', { ascending: true });
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const statsByAgency = await this.getStatsForAgencies(rows.map((r: any) => r.id));

    return {
      items: rows.map((row: any) =>
        mapAgencyStatsRow(row, statsByAgency.get(row.id) ?? { forSaleCount: 0, forRentCount: 0 }),
      ),
      total: count ?? 0,
      page,
      pageSize,
    };
  }

  // Batched counterpart to getStats() below — one pair of queries for every
  // agency on the page instead of one round-trip per card.
  private async getStatsForAgencies(
    agencyIds: string[],
  ): Promise<Map<string, { forSaleCount: number; forRentCount: number }>> {
    const result = new Map<string, { forSaleCount: number; forRentCount: number }>();
    if (agencyIds.length === 0) return result;

    const { data: agentRows, error: agentError } = await this.supabase.client
      .from('agent_profiles')
      .select('id, agency_id')
      .in('agency_id', agencyIds);
    if (agentError) throw agentError;

    const agencyByAgent = new Map((agentRows ?? []).map((r: any) => [r.id, r.agency_id]));
    const agentIds = Array.from(agencyByAgent.keys());
    if (agentIds.length === 0) return result;

    const { data: listingRows, error: listingError } = await this.supabase.client
      .from('listings')
      .select('agent_id, purpose')
      .eq('status', 'verified')
      .in('agent_id', agentIds);
    if (listingError) throw listingError;

    for (const row of listingRows ?? []) {
      const agencyId = agencyByAgent.get((row as any).agent_id);
      if (!agencyId) continue;
      const entry = result.get(agencyId) ?? { forSaleCount: 0, forRentCount: 0 };
      if ((row as any).purpose === 'sale') entry.forSaleCount++;
      else entry.forRentCount++;
      result.set(agencyId, entry);
    }
    return result;
  }

  // Backs "Browse Agencies By City" — same shape as
  // projects.repository.ts::listCitiesWithCounts.
  async listCitiesWithCounts(): Promise<{ city: string; count: number }[]> {
    const { data, error } = await this.supabase.client
      .from('agencies')
      .select('city')
      .eq('verification_status', 'verified');
    if (error) throw error;

    const counts = new Map<string, number>();
    for (const row of data ?? []) {
      const city = (row as any).city as string | null;
      if (!city) continue;
      counts.set(city, (counts.get(city) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Super Admin-curated placement — deliberately a separate action from
  // update() (which agency admins can also call): an agency shouldn't be
  // able to promote itself into Titanium/Featured by editing its own record.
  async setTier(id: string, tier: AgencyTier) {
    const { data, error } = await this.supabase.client
      .from('agencies')
      .update({ tier })
      .eq('id', id)
      .select(AGENCY_COLUMNS)
      .single();
    if (error) throw error;
    return data;
  }

  async findBySlug(slug: string) {
    // phone/whatsapp added for the Agency detail page's "Agency Staff"
    // Call/WhatsApp buttons (apps/web /agents/[slug]) — email deliberately
    // not embedded, agent_profiles has no email column of its own (it lives
    // on auth.users); the page falls back to the same fixed support address
    // AgentCard.tsx already uses for that reason.
    const { data, error } = await this.supabase.client
      .from('agencies')
      .select(`${AGENCY_COLUMNS}, agent_profiles (id, display_name, title, photo_url, phone, whatsapp)`)
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return data;
  }

  // Property inventory broken down by purpose + type — confirmed on a real
  // Zameen agency page ("12 Houses... for sale / 8 Buildings... for rent").
  // Not a stored figure: computed here from `listings` every call.
  async getStats(agencyId: string) {
    const { data: agentRows, error: agentError } = await this.supabase.client
      .from('agent_profiles')
      .select('id')
      .eq('agency_id', agencyId);
    if (agentError) throw agentError;

    const agentIds = (agentRows ?? []).map((r: any) => r.id);
    if (agentIds.length === 0) {
      return { forSaleCount: 0, forRentCount: 0, byPropertyType: [], byBoostTier: [] };
    }

    const { data: listingRows, error: listingError } = await this.supabase.client
      .from('listings')
      .select('purpose, boost_tier, property_types (slug, label)')
      .eq('status', 'verified')
      .in('agent_id', agentIds);
    if (listingError) throw listingError;

    let forSaleCount = 0;
    let forRentCount = 0;
    // Keyed by slug (not label) — labels aren't guaranteed unique, and slug
    // is what the "Properties By [Agency]" stat tiles need to deep-link into
    // GET /listings?agencySlug=&propertyTypeSlug= (apps/web /agents/[slug]).
    const byType = new Map<string, { label: string; forSale: number; forRent: number }>();
    // Confirmed real on the Profolio dashboard's Listings card — boost tier
    // breakdown shown alongside purpose, mirrors AgentsRepository.getStats().
    const byBoostTier = new Map<string, number>();

    for (const row of listingRows ?? []) {
      const propertyType = (row as any).property_types;
      const slug = propertyType?.slug ?? 'other';
      const label = propertyType?.label ?? 'Other';
      const entry = byType.get(slug) ?? { label, forSale: 0, forRent: 0 };
      if ((row as any).purpose === 'sale') {
        forSaleCount++;
        entry.forSale++;
      } else {
        forRentCount++;
        entry.forRent++;
      }
      byType.set(slug, entry);

      const tier = (row as any).boost_tier as string;
      byBoostTier.set(tier, (byBoostTier.get(tier) ?? 0) + 1);
    }

    return {
      forSaleCount,
      forRentCount,
      byPropertyType: Array.from(byType.entries()).map(([propertyTypeSlug, counts]) => ({ propertyTypeSlug, ...counts })),
      byBoostTier: Array.from(byBoostTier.entries()).map(([tier, count]) => ({ tier, count })),
    };
  }

  async create(input: CreateAgencyDto) {
    const { data, error } = await this.supabase.client
      .from('agencies')
      .insert({
        name: input.name,
        slug: input.slug,
        description: input.description,
        phone: input.phone,
        email: input.email,
        city: input.city,
        address: input.address,
        business_hours: input.businessHours,
        logo_url: input.logoUrl,
        sales_associate_count: input.salesAssociateCount,
        verification_status: 'pending',
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Super Admin verification decision — the write-mechanism `create()` above
  // deliberately left unbuilt (every agency starts and stays 'pending' until
  // now). Mirrors the verification/rejection pattern already established for
  // listings (verification_audit_log's status transitions).
  async setVerificationStatus(id: string, status: 'verified' | 'rejected', reason?: string) {
    // Hard gate — real business requirement: an agency can't be verified
    // without company registration, owner's ID card, and a tax certificate
    // already uploaded.
    if (status === 'verified') {
      await this.assertDocumentsComplete(id);
    }

    const { data, error } = await this.supabase.client
      .from('agencies')
      .update({ verification_status: status, rejection_reason: status === 'rejected' ? (reason ?? null) : null })
      .eq('id', id)
      .select(AGENCY_COLUMNS)
      .single();
    if (error) throw error;

    await this.notifyAgencyAdmins(id, status, reason);
    return data;
  }

  // 'verification_status' has existed as a NotificationType since
  // 0009_notifications.sql with no code path ever using it for agencies —
  // notifies whoever registered/manages the agency (is_agency_admin=true),
  // not every staff member, same "notify the people who act on this, not
  // everyone affected" reasoning notifySuperAdmins-style helpers elsewhere
  // apply. Best-effort, same discipline as SupportRepository.notifySuperAdmins.
  private async notifyAgencyAdmins(agencyId: string, status: 'verified' | 'rejected', reason?: string): Promise<void> {
    try {
      const { data: admins, error } = await this.supabase.client
        .from('agent_profiles')
        .select('user_id')
        .eq('agency_id', agencyId)
        .eq('is_agency_admin', true);
      if (error || !admins) return;

      await Promise.all(
        admins.map((admin: any) =>
          this.notifications.create({
            userId: admin.user_id,
            type: 'verification_status',
            title: status === 'verified' ? 'Your agency is now verified' : 'Your agency verification was rejected',
            body: status === 'rejected' ? reason : undefined,
          }),
        ),
      );
    } catch (err) {
      this.logger.warn(`Failed to notify agency admins of verification status change — agency ${agencyId}`, err as Error);
    }
  }

  async update(id: string, input: UpdateAgencyDto) {
    const { data, error } = await this.supabase.client
      .from('agencies')
      .update({
        name: input.name,
        description: input.description,
        phone: input.phone,
        email: input.email,
        city: input.city,
        address: input.address,
        business_hours: input.businessHours,
        logo_url: input.logoUrl,
        sales_associate_count: input.salesAssociateCount,
        default_commission_rate: input.defaultCommissionRate,
      })
      .eq('id', id)
      .select(AGENCY_COLUMNS)
      .single();
    if (error) throw error;
    return data;
  }

  async remove(id: string) {
    const { error } = await this.supabase.client.from('agencies').delete().eq('id', id);
    if (error) throw error;
    return { id };
  }

  // Real onboarding requirement — company registration, owner's ID card,
  // tax certificate. Only PNG/JPEG/PDF are accepted, enforced server-side in
  // DocumentsService.upload(), not just by file extension.
  async addDocument(agencyId: string, documentType: OnboardingDocumentType, file: Express.Multer.File) {
    const path = await this.documents.upload(`agencies/${agencyId}`, file);

    // "Replace" superseding an existing document of this type: find prior
    // rows for the same (agency_id, document_type) before inserting, so we
    // can drop them afterward — without this, listDocuments keeps returning
    // every historical upload and the newest one isn't guaranteed to be
    // resolvable as "the" document for that type.
    const { data: staleRows, error: staleError } = await this.supabase.client
      .from('onboarding_documents')
      .select('id, file_path')
      .eq('agency_id', agencyId)
      .eq('document_type', documentType);
    if (staleError) throw staleError;

    const { data, error } = await this.supabase.client
      .from('onboarding_documents')
      .insert({ agency_id: agencyId, document_type: documentType, file_path: path })
      .select('id, document_type, file_path, uploaded_at')
      .single();
    if (error) throw error;

    if (staleRows?.length) {
      const { error: deleteError } = await this.supabase.client
        .from('onboarding_documents')
        .delete()
        .in('id', staleRows.map((row) => row.id));
      if (deleteError) throw deleteError;

      // Storage cleanup is best-effort — the DB rows above are the source
      // of truth for what's "the" document, so a failed object removal here
      // just leaves an orphaned file rather than corrupting any state.
      await Promise.all(staleRows.map((row) => this.documents.remove(row.file_path).catch(() => undefined)));
    }

    return {
      id: data.id,
      documentType: data.document_type,
      url: await this.documents.getSignedUrl(data.file_path),
      uploadedAt: data.uploaded_at,
    };
  }

  async listDocuments(agencyId: string) {
    const { data, error } = await this.supabase.client
      .from('onboarding_documents')
      .select('id, document_type, file_path, uploaded_at')
      .eq('agency_id', agencyId)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;

    return Promise.all(
      (data ?? []).map(async (row: any) => ({
        id: row.id,
        documentType: row.document_type,
        url: await this.documents.getSignedUrl(row.file_path),
        uploadedAt: row.uploaded_at,
      })),
    );
  }

  async getDocumentCompleteness(agencyId: string) {
    const { data, error } = await this.supabase.client
      .from('onboarding_documents')
      .select('document_type')
      .eq('agency_id', agencyId);
    if (error) throw error;

    const uploaded = Array.from(new Set((data ?? []).map((row: any) => row.document_type as OnboardingDocumentType)));
    const missing = REQUIRED_ONBOARDING_DOCUMENT_TYPES.filter((type) => !uploaded.includes(type));

    return { required: REQUIRED_ONBOARDING_DOCUMENT_TYPES, uploaded, missing };
  }

  private async assertDocumentsComplete(agencyId: string) {
    const { missing } = await this.getDocumentCompleteness(agencyId);
    if (missing.length > 0) {
      throw new BadRequestException(`Cannot verify agency — missing required documents: ${missing.join(', ')}`);
    }
  }

  // --- Agency self-management ("Agency Staff") ---------------------------
  // An agency admin is still role 'agent' everywhere else in the system —
  // see supabase/migrations/0023_agency_admin_flag.sql. These methods trust
  // their caller (ownership/admin-flag checks happen in the controller, same
  // discipline as assertOwnAgentOrAdmin in agents.controller.ts).

  // Used by the controller to authorize every staff-management endpoint:
  // resolves the calling agent's own agency_id + admin flag in one query.
  async getStaffScope(agentId: string): Promise<{ agencyId: string | null; isAgencyAdmin: boolean }> {
    const { data, error } = await this.supabase.client
      .from('agent_profiles')
      .select('agency_id, is_agency_admin')
      .eq('id', agentId)
      .single();
    if (error) throw error;
    return { agencyId: data.agency_id, isAgencyAdmin: data.is_agency_admin };
  }

  async listStaff(agencyId: string) {
    const { data, error } = await this.supabase.client
      .from('agent_profiles')
      .select('id, display_name, phone, city, verification_status, rejection_reason, is_agency_admin, photo_url')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      displayName: row.display_name,
      phone: row.phone,
      city: row.city,
      verificationStatus: row.verification_status,
      rejectionReason: row.rejection_reason,
      isAgencyAdmin: row.is_agency_admin,
      photoUrl: row.photo_url,
    }));
  }

  // Self-service agency registration (signup's "Agency" account type) — the
  // registering buyer becomes the new agency's admin. Same sync pattern as
  // AgentsRepository.applyAsAgent() (insert profile row(s), then merge
  // app_metadata + profiles.role), just with an agency row inserted first
  // and is_agency_admin forced true on the resulting agent_profiles row.
  // Both rows start 'pending' — a real agency admin still has to upload the
  // 3 onboarding documents and wait for super_admin review, same as any
  // other self-service path.
  async registerSelfService(userId: string, input: RegisterAgencyDto) {
    const { data: agency, error: agencyError } = await this.supabase.client
      .from('agencies')
      .insert({
        name: input.agencyName,
        slug: input.agencySlug,
        phone: input.agencyPhone,
        email: input.agencyEmail,
        city: input.agencyCity,
        verification_status: 'pending',
        sales_associate_count: input.salesAssociateCount,
      })
      .select(AGENCY_COLUMNS)
      .single();
    if (agencyError) {
      // '23505' = Postgres unique_violation — this specific, anticipated
      // case (agency name already taken, since the slug is derived from it)
      // gets a clear message; AllExceptionsFilter deliberately masks every
      // other raw DB error as a generic 500 (never leak constraint/column
      // details to callers), which is correct and untouched here.
      if ((agencyError as { code?: string }).code === '23505') {
        throw new ConflictException('An agency with this name already exists — please choose a different name.');
      }
      throw agencyError;
    }

    // Everything past this point can fail independently (agent_profiles
    // insert, auth metadata sync, profiles sync) — PostgREST has no
    // multi-table transaction, so a failure here previously left the
    // agency row above permanently orphaned, blocking every retry on a
    // slug uniqueness violation. Compensate by deleting/reverting whatever
    // was created before re-throwing, so a failed attempt is always cleanly
    // retryable — agent_profiles first (it FKs to agencies, so the agency
    // delete would otherwise fail with a foreign-key violation and mask
    // the original error).
    //
    // handle_new_user() (0055_default_signup_role_agent.sql) now
    // auto-creates a minimal agent_profiles row (agency_id null) for every
    // signup, including someone about to register an agency — so this can
    // no longer assume a bare INSERT is safe; it collided on
    // agent_profiles.user_id's unique constraint, threw, and the compensation
    // above deleted the just-created agency, silently masking a 500 while
    // leaving the caller's retry logic believing signup had failed outright
    // (see the fix commit for the full trace). Find-then-update-or-insert
    // instead, and track whether this call created the row or only updated
    // a pre-existing one so failure compensation does the right thing either
    // way (delete a row we created; revert one we merely updated, since
    // deleting it would destroy state that predates this call).
    let agentProfileId: string | undefined;
    let createdAgentProfile = false;
    let priorProfileValues: { display_name: string | null; phone: string | null } | undefined;
    try {
      const { data: existingProfile, error: findError } = await this.supabase.client
        .from('agent_profiles')
        .select('id, display_name, phone')
        .eq('user_id', userId)
        .maybeSingle();
      if (findError) throw findError;

      if (existingProfile) {
        priorProfileValues = { display_name: existingProfile.display_name, phone: existingProfile.phone };
        const { data: updatedProfile, error: updateError } = await this.supabase.client
          .from('agent_profiles')
          .update({
            display_name: input.displayName,
            phone: input.agentPhone,
            agency_id: agency.id,
            is_agency_admin: true,
          })
          .eq('id', existingProfile.id)
          .select('id')
          .single();
        if (updateError) throw updateError;
        agentProfileId = updatedProfile.id;
      } else {
        const { data: insertedProfile, error: insertError } = await this.supabase.client
          .from('agent_profiles')
          .insert({
            user_id: userId,
            display_name: input.displayName,
            phone: input.agentPhone,
            agency_id: agency.id,
            is_agency_admin: true,
          })
          .select('id')
          .single();
        if (insertError) {
          // Narrow remaining race: two concurrent requests both pass the
          // SELECT-found-nothing check above before either INSERTs. Give a
          // clear, specific error instead of letting a raw 23505 surface as
          // AllExceptionsFilter's generic masked 500 — same discipline as
          // the agency-name collision handled above.
          if ((insertError as { code?: string }).code === '23505') {
            throw new ConflictException('You already have an agent account — please try again.');
          }
          throw insertError;
        }
        agentProfileId = insertedProfile.id;
        createdAgentProfile = true;
      }

      const { data: existingUser, error: getError } = await this.supabase.client.auth.admin.getUserById(userId);
      if (getError) throw getError;

      // agency_id in app_metadata (not just agent_id) — since
      // 0072_default_signup_role_agent_again.sql, every signup already gets
      // a bare agent_profiles row and agent_id claim from handle_new_user(),
      // so agent_id alone no longer distinguishes "went through agency
      // registration" from "just signed up." signup/page.tsx's
      // alreadyHasAgency retry-resume check (and its mobile equivalent) key
      // off this claim specifically for that reason — keep them in sync if
      // this claim's name/shape ever changes.
      const { error: metadataError } = await this.supabase.client.auth.admin.updateUserById(userId, {
        app_metadata: { ...existingUser.user.app_metadata, role: 'agent', agent_id: agentProfileId, agency_id: agency.id },
      });
      if (metadataError) throw metadataError;

      const { error: profileError } = await this.supabase.client
        .from('profiles')
        .update({ role: 'agent', agent_id: agentProfileId })
        .eq('id', userId);
      if (profileError) throw profileError;

      return { agency, agentId: agentProfileId };
    } catch (err) {
      if (agentProfileId) {
        if (createdAgentProfile) {
          await this.supabase.client.from('agent_profiles').delete().eq('id', agentProfileId);
        } else {
          // Restore the exact pre-existing values (captured above) rather
          // than nulling them out — this row predates this call.
          await this.supabase.client
            .from('agent_profiles')
            .update({
              agency_id: null,
              is_agency_admin: false,
              display_name: priorProfileValues?.display_name ?? null,
              phone: priorProfileValues?.phone ?? null,
            })
            .eq('id', agentProfileId);
        }
      }
      await this.supabase.client.from('agencies').delete().eq('id', agency.id);
      throw err;
    }
  }

  // Same two-step create-user pattern as UsersRepository.create()'s agent
  // branch, duplicated rather than cross-imported (UsersRepository lives in
  // a separate Nest module) — agencyId is always forced from the route
  // param, never client-supplied, unlike CreateUserDto's optional agencyId.
  async addStaff(agencyId: string, input: { email: string; password: string; displayName?: string; photoUrl?: string }) {
    const { data: created, error: createError } = await this.supabase.client.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      app_metadata: { role: 'agent', display_name: input.displayName },
    });
    if (createError) throw createError;
    const userId = created.user.id;

    const { data: agentProfile, error: agentError } = await this.supabase.client
      .from('agent_profiles')
      .insert({ user_id: userId, display_name: input.displayName, agency_id: agencyId, photo_url: input.photoUrl })
      .select('id')
      .single();
    if (agentError) throw agentError;

    const { error: backfillError } = await this.supabase.client.auth.admin.updateUserById(userId, {
      app_metadata: { role: 'agent', agent_id: agentProfile.id, display_name: input.displayName },
    });
    if (backfillError) throw backfillError;

    const { error: profileError } = await this.supabase.client
      .from('profiles')
      .update({ role: 'agent', agent_id: agentProfile.id })
      .eq('id', userId);
    if (profileError) throw profileError;

    return agentProfile;
  }

  // WHERE agency_id also scopes this — targeting an agent from a different
  // agency silently affects 0 rows rather than needing a separate lookup.
  async setStaffAdmin(agencyId: string, agentId: string, isAgencyAdmin: boolean) {
    const { data, error } = await this.supabase.client
      .from('agent_profiles')
      .update({ is_agency_admin: isAgencyAdmin })
      .eq('id', agentId)
      .eq('agency_id', agencyId)
      .select('id, is_agency_admin')
      .single();
    if (error) throw error;
    return { id: data.id, isAgencyAdmin: data.is_agency_admin };
  }

  // Unlinks, not a hard delete — the agent account itself (and their
  // listings) survives, just no longer affiliated with this agency.
  async removeStaff(agencyId: string, agentId: string) {
    const { error } = await this.supabase.client
      .from('agent_profiles')
      .update({ agency_id: null, is_agency_admin: false })
      .eq('id', agentId)
      .eq('agency_id', agencyId);
    if (error) throw error;
    return { id: agentId };
  }
}
