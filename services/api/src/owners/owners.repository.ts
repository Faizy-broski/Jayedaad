import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { DocumentsService } from '../documents/documents.service';

export type OwnerIdentityDocumentType = 'cnic_front' | 'cnic_back' | 'selfie';

// Phase 1 of the Document Verification spec — individual owner identity is
// a one-time check (CNIC front/back + selfie), separate from per-listing
// ownership_proof/utility_bill (see listings.repository.ts).
export const REQUIRED_OWNER_IDENTITY_DOCUMENT_TYPES: OwnerIdentityDocumentType[] = [
  'cnic_front',
  'cnic_back',
  'selfie',
];

@Injectable()
export class OwnersRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly documents: DocumentsService,
  ) {}

  // Self-service buyer -> owner promotion — mirrors AgentsRepository
  // .applyAsAgent()'s two-write sync (JWT app_metadata + profiles.role),
  // minus the agent_profiles insert (owners have no separate profile
  // table). No approval queue: unlike becoming an agent, declaring
  // yourself an owner needs no review — the CNIC identity verification and
  // per-listing ownership documents are the real checks, both still
  // required afterward.
  async promoteToOwner(userId: string) {
    const { data: existing, error: getError } = await this.supabase.client.auth.admin.getUserById(userId);
    if (getError) throw getError;

    const { error: metadataError } = await this.supabase.client.auth.admin.updateUserById(userId, {
      app_metadata: { ...existing.user.app_metadata, role: 'owner' },
    });
    if (metadataError) throw metadataError;

    const { error: profileError } = await this.supabase.client.from('profiles').update({ role: 'owner' }).eq('id', userId);
    if (profileError) throw profileError;

    return { userId, role: 'owner' as const };
  }

  // owner_identity_verifications has no row until the owner uploads their
  // first document — created lazily here rather than at signup, since only
  // owners who actually try to list a property need one.
  private async ensureVerification(userId: string): Promise<string> {
    const { data: existing, error: findError } = await this.supabase.client
      .from('owner_identity_verifications')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    if (findError) throw findError;
    if (existing) return existing.id;

    const { data, error } = await this.supabase.client
      .from('owner_identity_verifications')
      .insert({ user_id: userId })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  }

  private async findVerificationRow(userId: string) {
    const { data, error } = await this.supabase.client
      .from('owner_identity_verifications')
      .select('id, status, created_at, reviewed_at')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  private async listDocumentsByVerificationId(verificationId: string) {
    const { data, error } = await this.supabase.client
      .from('owner_identity_documents')
      .select('id, document_type, file_path, uploaded_at')
      .eq('verification_id', verificationId)
      .order('uploaded_at', { ascending: false });
    if (error) throw error;

    return Promise.all(
      (data ?? []).map(async (row: any) => ({
        id: row.id,
        documentType: row.document_type as OwnerIdentityDocumentType,
        url: await this.documents.getSignedUrl(row.file_path),
        uploadedAt: row.uploaded_at,
      })),
    );
  }

  // status: null means the owner has never started verification (no row
  // yet) — the client treats null the same as 'pending' for gating purposes,
  // but it's surfaced distinctly since nothing has actually been uploaded.
  async getVerification(userId: string) {
    const row = await this.findVerificationRow(userId);
    if (!row) return { status: null as null, documents: [], reviewedAt: null };
    return {
      status: row.status as 'pending' | 'verified' | 'rejected',
      documents: await this.listDocumentsByVerificationId(row.id),
      reviewedAt: row.reviewed_at,
    };
  }

  // Admin-only equivalent of getVerification() above, minus self-scoping —
  // lets staff pull a specific owner's actual CNIC/selfie rows (with signed
  // URLs) by userId, same shape as AgentsRepository.listDocuments().
  // getDocumentCompleteness() below deliberately withholds the real rows/
  // URLs (used by the admin queue's counts only); this is the first place
  // they're exposed to anyone but the owner themselves.
  async listDocumentsForAdmin(userId: string) {
    const row = await this.findVerificationRow(userId);
    if (!row) return [];
    return this.listDocumentsByVerificationId(row.id);
  }

  async getDocumentCompleteness(userId: string) {
    const row = await this.findVerificationRow(userId);
    const uploaded = row
      ? Array.from(new Set((await this.listDocumentsByVerificationId(row.id)).map((doc) => doc.documentType)))
      : [];
    const missing = REQUIRED_OWNER_IDENTITY_DOCUMENT_TYPES.filter((type) => !uploaded.includes(type));
    return { required: REQUIRED_OWNER_IDENTITY_DOCUMENT_TYPES, uploaded, missing };
  }

  async addDocument(userId: string, documentType: OwnerIdentityDocumentType, file: Express.Multer.File) {
    const verificationId = await this.ensureVerification(userId);
    const path = await this.documents.upload(`owners/${userId}`, file);

    // "Replace" superseding an existing document of this type: find prior
    // rows for the same (verification_id, document_type) before inserting,
    // so we can drop them afterward — mirrors agencies.repository.ts::addDocument.
    const { data: staleRows, error: staleError } = await this.supabase.client
      .from('owner_identity_documents')
      .select('id, file_path')
      .eq('verification_id', verificationId)
      .eq('document_type', documentType);
    if (staleError) throw staleError;

    const { data, error } = await this.supabase.client
      .from('owner_identity_documents')
      .insert({ verification_id: verificationId, document_type: documentType, file_path: path })
      .select('id, document_type, file_path, uploaded_at')
      .single();
    if (error) throw error;

    if (staleRows?.length) {
      const { error: deleteError } = await this.supabase.client
        .from('owner_identity_documents')
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

  // Staff review queue, same shape as AgentsRepository.listPendingVerification
  // — every still-'pending' row with completeness inlined. profiles isn't
  // directly FK-joinable here (owner_identity_verifications.user_id and
  // profiles.id both reference auth.users independently), so it's a
  // deliberate second query + in-memory merge rather than a guessed embed.
  async listPendingVerification() {
    const { data, error } = await this.supabase.client
      .from('owner_identity_verifications')
      .select('id, user_id, status, created_at, reviewed_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (error) throw error;

    const rows = data ?? [];
    if (rows.length === 0) return [];

    const userIds = rows.map((row: any) => row.user_id);
    const { data: profileRows, error: profileError } = await this.supabase.client
      .from('profiles')
      .select('id, display_name, email')
      .in('id', userIds);
    if (profileError) throw profileError;
    const profileById = new Map((profileRows ?? []).map((p: any) => [p.id, p]));

    return Promise.all(
      rows.map(async (row: any) => ({
        userId: row.user_id,
        displayName: profileById.get(row.user_id)?.display_name ?? null,
        email: profileById.get(row.user_id)?.email ?? null,
        status: row.status,
        createdAt: row.created_at,
        documents: await this.getDocumentCompleteness(row.user_id),
      })),
    );
  }

  // Only 'verified' is gated on completeness — a staff member rejecting an
  // owner who hasn't finished uploading is always allowed.
  async setVerificationStatus(userId: string, status: 'verified' | 'rejected') {
    if (status === 'verified') {
      const { missing } = await this.getDocumentCompleteness(userId);
      if (missing.length > 0) {
        throw new BadRequestException(`Cannot verify owner — missing required documents: ${missing.join(', ')}`);
      }
    }

    const { data, error } = await this.supabase.client
      .from('owner_identity_verifications')
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select('id, user_id, status, reviewed_at')
      .single();
    if (error) throw error;

    return { userId: data.user_id, status: data.status, reviewedAt: data.reviewed_at };
  }
}
