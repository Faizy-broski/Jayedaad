import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateAgentProfileDto } from './dto/update-profile.dto';
import { GrantCreditsDto } from './dto/grant-credits.dto';
import { ApplyAsAgentDto } from './dto/apply-as-agent.dto';
import { DocumentsService } from '../documents/documents.service';
import { OnboardingDocumentType, REQUIRED_ONBOARDING_DOCUMENT_TYPES } from '../agencies/agencies.repository';

const PROFILE_COLUMNS =
  'id, display_name, title, bio, phone, whatsapp, landline, city, address, photo_url, verification_status, is_agency_admin, agencies (id, name, slug, logo_url)';

@Injectable()
export class AgentsRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly documents: DocumentsService,
  ) {}

  // Supabase's implicit-join select returns raw snake_case (display_name,
  // photo_url, agencies) — packages/core's AgentProfileSummary expects
  // camelCase (displayName, photoUrl, agency). This was missing entirely:
  // phone/whatsapp/landline/city/address/bio happen to be spelled the same
  // in both cases so they "worked", but displayName/photoUrl/agency were
  // always undefined on the client — the exact cause of "Name doesn't save"
  // (the form's useEffect kept resetting to '' since profile.displayName
  // never actually held the saved value).
  private mapProfileRow(row: any) {
    return {
      id: row.id,
      displayName: row.display_name,
      title: row.title,
      bio: row.bio,
      phone: row.phone,
      whatsapp: row.whatsapp,
      landline: row.landline,
      city: row.city,
      address: row.address,
      photoUrl: row.photo_url,
      verificationStatus: row.verification_status,
      isAgencyAdmin: row.is_agency_admin,
      agency: row.agencies ?? null,
    };
  }

  async findProfile(agentId: string) {
    const { data, error } = await this.supabase.client
      .from('agent_profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', agentId)
      .single();
    if (error) throw error;
    return this.mapProfileRow(data);
  }

  // Staff review queue — every agent_profiles row still 'pending', with
  // document completeness inlined so a reviewer doesn't need a second
  // request per row before deciding.
  async listPendingVerification() {
    const { data, error } = await this.supabase.client
      .from('agent_profiles')
      .select(PROFILE_COLUMNS)
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: true });
    if (error) throw error;

    return Promise.all(
      (data ?? []).map(async (row: any) => ({
        ...this.mapProfileRow(row),
        documents: await this.getDocumentCompleteness(row.id),
      })),
    );
  }

  // Self-service "Apply to become an agent" — same two-step pattern as
  // UsersRepository.create()'s agent branch (insert agent_profiles, then
  // sync app_metadata.role + profiles.role), just triggered by the buyer
  // themselves instead of super_admin. verification_status defaults to
  // 'pending' in the DB — the applicant lands in the same review queue a
  // super_admin-created agent would.
  async applyAsAgent(userId: string, input: ApplyAsAgentDto) {
    const { data: agentProfile, error: insertError } = await this.supabase.client
      .from('agent_profiles')
      .insert({ user_id: userId, display_name: input.displayName, phone: input.phone, city: input.city })
      .select('id')
      .single();
    if (insertError) throw insertError;

    // If the metadata/profile sync below fails, agent_profiles.user_id's
    // unique constraint would otherwise block every retry (same orphaned-
    // row class of bug as AgenciesRepository.registerSelfService — see its
    // comment). Compensate by deleting the just-created row before
    // re-throwing.
    try {
      const { data: existing, error: getError } = await this.supabase.client.auth.admin.getUserById(userId);
      if (getError) throw getError;

      const { error: metadataError } = await this.supabase.client.auth.admin.updateUserById(userId, {
        app_metadata: { ...existing.user.app_metadata, role: 'agent', agent_id: agentProfile.id },
      });
      if (metadataError) throw metadataError;

      const { error: profileError } = await this.supabase.client
        .from('profiles')
        .update({ role: 'agent', agent_id: agentProfile.id })
        .eq('id', userId);
      if (profileError) throw profileError;

      return this.findProfile(agentProfile.id);
    } catch (err) {
      await this.supabase.client.from('agent_profiles').delete().eq('id', agentProfile.id);
      throw err;
    }
  }

  // The Profolio "User Settings" page's actual save action. Ownership is
  // enforced at the controller (see agents.controller.ts::assertOwnAgentOrAdmin),
  // not here — this method trusts its caller, same as every other repository
  // in this codebase.
  async updateProfile(agentId: string, input: UpdateAgentProfileDto) {
    const { data, error } = await this.supabase.client
      .from('agent_profiles')
      .update({
        display_name: input.displayName,
        phone: input.phone,
        whatsapp: input.whatsapp,
        landline: input.landline,
        city: input.city,
        address: input.address,
        bio: input.bio,
        photo_url: input.photoUrl,
      })
      .eq('id', agentId)
      .select(PROFILE_COLUMNS)
      .single();
    if (error) throw error;
    return this.mapProfileRow(data);
  }

  // The write side of "Upload a picture" — separate from updateProfile()
  // since it's driven by a file upload, not the rest of the form fields.
  async updatePhoto(agentId: string, photoUrl: string) {
    const { data, error } = await this.supabase.client
      .from('agent_profiles')
      .update({ photo_url: photoUrl })
      .eq('id', agentId)
      .select(PROFILE_COLUMNS)
      .single();
    if (error) throw error;
    return this.mapProfileRow(data);
  }

  // Property inventory broken down by purpose + type, scoped to one agent —
  // mirrors AgenciesRepository.getStats() exactly, just without the
  // agency-membership resolution step. Real Zameen agency pages show this
  // exact stat shape (counts + breakdown, no listing grid); nothing
  // previously gave an individual agent's own profile the same treatment —
  // a real gap, especially for independent agents with no agency page at all.
  async getStats(agentId: string) {
    const { data: listingRows, error: listingError } = await this.supabase.client
      .from('listings')
      .select('purpose, boost_tier, property_types (label)')
      .eq('status', 'verified')
      .eq('agent_id', agentId);
    if (listingError) throw listingError;

    let forSaleCount = 0;
    let forRentCount = 0;
    const byType = new Map<string, { forSale: number; forRent: number }>();
    // Confirmed real on the Profolio dashboard's Listings card (Active/For
    // Sale/For Rent/Super Hot/Hot counts) — boost tier is shown right
    // alongside purpose, not just property type.
    const byBoostTier = new Map<string, number>();

    for (const row of listingRows ?? []) {
      const label = (row as any).property_types?.label ?? 'Other';
      const entry = byType.get(label) ?? { forSale: 0, forRent: 0 };
      if ((row as any).purpose === 'sale') {
        forSaleCount++;
        entry.forSale++;
      } else {
        forRentCount++;
        entry.forRent++;
      }
      byType.set(label, entry);

      const tier = (row as any).boost_tier as string;
      byBoostTier.set(tier, (byBoostTier.get(tier) ?? 0) + 1);
    }

    return {
      forSaleCount,
      forRentCount,
      byPropertyType: Array.from(byType.entries()).map(([label, counts]) => ({ label, ...counts })),
      byBoostTier: Array.from(byBoostTier.entries()).map(([tier, count]) => ({ tier, count })),
    };
  }

  // Confirmed real on the Profolio Analytics card: Views/Clicks/Calls/
  // WhatsApp/SMS/Emails from listing_engagement_events, plus Leads from the
  // `leads` table, filterable by purpose (all/sale/rent) and a date range —
  // matches the real UI's "All / For Sale / For Rent" + "Last 30 Days" filters.
  async getAnalytics(agentId: string, filters: { purpose?: 'sale' | 'rent'; since?: Date } = {}) {
    const since = filters.since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    let listingsQuery = this.supabase.client.from('listings').select('id').eq('agent_id', agentId);
    if (filters.purpose) listingsQuery = listingsQuery.eq('purpose', filters.purpose);
    const { data: listingRows, error: listingsError } = await listingsQuery;
    if (listingsError) throw listingsError;

    const listingIds = (listingRows ?? []).map((r: any) => r.id);
    if (listingIds.length === 0) {
      return { views: 0, clicks: 0, leads: 0, calls: 0, whatsapp: 0, sms: 0, emails: 0 };
    }

    const [{ data: eventRows, error: eventsError }, { count: leadsCount, error: leadsError }] = await Promise.all([
      this.supabase.client
        .from('listing_engagement_events')
        .select('type')
        .in('listing_id', listingIds)
        .gte('created_at', since.toISOString()),
      this.supabase.client
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .in('listing_id', listingIds)
        .gte('created_at', since.toISOString()),
    ]);
    if (eventsError) throw eventsError;
    if (leadsError) throw leadsError;

    const counts = { views: 0, clicks: 0, calls: 0, whatsapp: 0, sms: 0, emails: 0 };
    for (const row of eventRows ?? []) {
      const type = (row as any).type as 'view' | 'click' | 'call' | 'whatsapp' | 'sms' | 'email';
      if (type === 'view') counts.views++;
      else if (type === 'click') counts.clicks++;
      else if (type === 'call') counts.calls++;
      else if (type === 'whatsapp') counts.whatsapp++;
      else if (type === 'sms') counts.sms++;
      else if (type === 'email') counts.emails++;
    }

    return { ...counts, leads: leadsCount ?? 0 };
  }

  // Same real listing_engagement_events ("view" rows) + leads rows as
  // getAnalytics above, just grouped by calendar day instead of summed into
  // one total — backs the mobile Dashboard's real "Listing performance"
  // (views/day) and "Leads captured" (leads/day) charts. Days with no
  // activity still appear in the result with 0s, so charts render a full,
  // evenly-spaced axis rather than skipping empty days.
  async getDailyAnalytics(agentId: string, days = 7): Promise<{ date: string; views: number; leads: number }[]> {
    const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
    since.setHours(0, 0, 0, 0);

    const { data: listingRows, error: listingsError } = await this.supabase.client
      .from('listings')
      .select('id')
      .eq('agent_id', agentId);
    if (listingsError) throw listingsError;

    const byDate = new Map<string, { views: number; leads: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      byDate.set(d.toISOString().slice(0, 10), { views: 0, leads: 0 });
    }

    const listingIds = (listingRows ?? []).map((r: any) => r.id);
    if (listingIds.length === 0) return Array.from(byDate, ([date, counts]) => ({ date, ...counts }));

    const [{ data: eventRows, error: eventsError }, { data: leadRows, error: leadsError }] = await Promise.all([
      this.supabase.client
        .from('listing_engagement_events')
        .select('type, created_at')
        .in('listing_id', listingIds)
        .eq('type', 'view')
        .gte('created_at', since.toISOString()),
      this.supabase.client
        .from('leads')
        .select('created_at')
        .in('listing_id', listingIds)
        .gte('created_at', since.toISOString()),
    ]);
    if (eventsError) throw eventsError;
    if (leadsError) throw leadsError;

    for (const row of eventRows ?? []) {
      const date = (row as any).created_at.slice(0, 10);
      const bucket = byDate.get(date);
      if (bucket) bucket.views++;
    }
    for (const row of leadRows ?? []) {
      const date = (row as any).created_at.slice(0, 10);
      const bucket = byDate.get(date);
      if (bucket) bucket.leads++;
    }

    return Array.from(byDate, ([date, counts]) => ({ date, ...counts }));
  }

  // Confirmed real on the Profolio "Quota and Credits" card: separate
  // Available/Used/Total pools per credit type, not a single quota number.
  async getCredits(agentId: string) {
    const { data, error } = await this.supabase.client
      .from('agent_credits')
      .select('credit_type, total, used')
      .eq('agent_id', agentId);
    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      creditType: row.credit_type,
      total: row.total,
      used: row.used,
      available: row.total - row.used,
    }));
  }

  // Super Admin grant/adjust — the write-side counterpart to getCredits()
  // above, explicitly deferred pending this module in the Analytics pass.
  // Upserts on (agent_id, credit_type) [0001_init.sql unique constraint];
  // only the fields actually provided are touched, so a partial adjustment
  // (e.g. just bumping `total`) doesn't clobber `used`.
  async grantCredits(agentId: string, input: GrantCreditsDto) {
    const existing = await this.supabase.client
      .from('agent_credits')
      .select('total, used')
      .eq('agent_id', agentId)
      .eq('credit_type', input.creditType)
      .maybeSingle();
    if (existing.error) throw existing.error;

    const { data, error } = await this.supabase.client
      .from('agent_credits')
      .upsert(
        {
          agent_id: agentId,
          credit_type: input.creditType,
          total: input.total ?? existing.data?.total ?? 0,
          used: input.used ?? existing.data?.used ?? 0,
        },
        { onConflict: 'agent_id,credit_type' },
      )
      .select('credit_type, total, used')
      .single();
    if (error) throw error;

    return { creditType: data.credit_type, total: data.total, used: data.used, available: data.total - data.used };
  }

  async listReviews(agentId: string) {
    const { data, error } = await this.supabase.client
      .from('agent_reviews')
      .select('id, agent_id, reviewer_id, rating, body, created_at')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Unique (agent_id, reviewer_id) constraint in the DB [0006 migration]
  // prevents review spam — one review per reviewer per agent.
  async createReview(reviewerId: string, agentId: string, input: CreateReviewDto) {
    const { data, error } = await this.supabase.client
      .from('agent_reviews')
      .insert({ agent_id: agentId, reviewer_id: reviewerId, rating: input.rating, body: input.body })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Real onboarding requirement — same document set as agencies (company
  // registration, owner's ID card, tax certificate): an independent agent
  // (no agency_id) stands in as their own "company" for onboarding purposes.
  async addDocument(agentId: string, documentType: OnboardingDocumentType, file: Express.Multer.File) {
    const path = await this.documents.upload(`agents/${agentId}`, file);

    const { data, error } = await this.supabase.client
      .from('onboarding_documents')
      .insert({ agent_id: agentId, document_type: documentType, file_path: path })
      .select('id, document_type, file_path, uploaded_at')
      .single();
    if (error) throw error;

    return {
      id: data.id,
      documentType: data.document_type,
      url: await this.documents.getSignedUrl(data.file_path),
      uploadedAt: data.uploaded_at,
    };
  }

  async listDocuments(agentId: string) {
    const { data, error } = await this.supabase.client
      .from('onboarding_documents')
      .select('id, document_type, file_path, uploaded_at')
      .eq('agent_id', agentId)
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

  async getDocumentCompleteness(agentId: string) {
    const { data, error } = await this.supabase.client
      .from('onboarding_documents')
      .select('document_type')
      .eq('agent_id', agentId);
    if (error) throw error;

    const uploaded = Array.from(new Set((data ?? []).map((row: any) => row.document_type as OnboardingDocumentType)));
    const missing = REQUIRED_ONBOARDING_DOCUMENT_TYPES.filter((type) => !uploaded.includes(type));

    return { required: REQUIRED_ONBOARDING_DOCUMENT_TYPES, uploaded, missing };
  }

  // The write path that never existed until now — agent_profiles.verification_status
  // has had no endpoint to set it since the column was introduced. Symmetric
  // with AgenciesRepository.setVerificationStatus() (also super_admin-only).
  // Only independent agents (no agency_id) are gated on document
  // completeness — an agency-affiliated agent is covered by the agency's
  // own documents/verification.
  async setVerificationStatus(agentId: string, status: 'verified' | 'rejected') {
    if (status === 'verified') {
      const { data: agent, error: agentError } = await this.supabase.client
        .from('agent_profiles')
        .select('agency_id')
        .eq('id', agentId)
        .single();
      if (agentError) throw agentError;

      if (!agent.agency_id) {
        const { missing } = await this.getDocumentCompleteness(agentId);
        if (missing.length > 0) {
          // DEBUG — remove once the 400 on PATCH /agents/:id/verify is
          // confirmed diagnosed. Frontend now surfaces this same message
          // via err.response.data.message (see admin/agents/page.tsx and
          // agent-verification/page.tsx), but logging it here too pins
          // down exactly which agent/documents triggered it server-side.
          console.warn(`[agents.verify] blocked — agentId=${agentId} missing=[${missing.join(', ')}]`);
          throw new BadRequestException(`Cannot verify agent — missing required documents: ${missing.join(', ')}`);
        }
      }
    }

    const { data, error } = await this.supabase.client
      .from('agent_profiles')
      .update({ verification_status: status })
      .eq('id', agentId)
      .select(PROFILE_COLUMNS)
      .single();
    if (error) throw error;
    return this.mapProfileRow(data);
  }
}
