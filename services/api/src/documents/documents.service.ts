import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

// Real business requirement: only PNG/JPEG/PDF may be uploaded to a
// documents section — checked against the actual uploaded file's MIME type
// (this is the first real file-upload capability in this codebase; every
// existing *_url field is just a text URL the client already uploaded
// elsewhere and handed over, with no server-side content-type guarantee).
export const ALLOWED_DOCUMENT_MIME_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'application/pdf': 'pdf',
};

const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;

// Storage mechanics only — no DB rows. Consumed by listings/agencies/agents
// repositories, which own the actual document rows and business rules
// (required-document completeness, etc).
@Injectable()
export class DocumentsService {
  constructor(private readonly supabase: SupabaseService) {}

  private get bucket(): string {
    const bucket = process.env.SUPABASE_DOCUMENTS_BUCKET;
    if (!bucket) throw new Error('SUPABASE_DOCUMENTS_BUCKET must be set');
    return bucket;
  }

  // Uploads into a PRIVATE bucket (ID cards/tax certificates are PII) —
  // returns the storage object path, not a URL. Callers persist the path,
  // then resolve a fresh signed URL at read time via getSignedUrl().
  async upload(pathPrefix: string, file: Express.Multer.File): Promise<string> {
    if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}" — only PNG, JPEG, and PDF files are allowed.`,
      );
    }
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      throw new BadRequestException(`File exceeds the ${MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024)}MB size limit.`);
    }

    const extension = EXTENSION_BY_MIME_TYPE[file.mimetype];
    const path = `${pathPrefix}/${randomUUID()}.${extension}`;

    const { error } = await this.supabase.client.storage
      .from(this.bucket)
      .upload(path, file.buffer, { contentType: file.mimetype });
    if (error) throw error;

    return path;
  }

  async getSignedUrl(path: string): Promise<string> {
    const { data, error } = await this.supabase.client.storage
      .from(this.bucket)
      .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);
    if (error) throw error;
    return data.signedUrl;
  }

  // Best-effort cleanup for superseded uploads (e.g. a "Replace" that
  // inserted a new onboarding_documents row for the same document type) —
  // callers should not fail the request if this errors, since the DB row is
  // already the source of truth and an orphaned object just wastes storage.
  async remove(path: string): Promise<void> {
    const { error } = await this.supabase.client.storage.from(this.bucket).remove([path]);
    if (error) throw error;
  }
}
