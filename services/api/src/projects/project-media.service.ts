import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

export const ALLOWED_PROJECT_MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'video/mp4',
  'video/quicktime',
  'application/pdf',
];
export const MAX_PROJECT_MEDIA_SIZE_BYTES = 30 * 1024 * 1024;

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'application/pdf': 'pdf',
};

// Reuses the listings media bucket (path-prefixed under projects/) rather
// than a dedicated bucket, to avoid manual Supabase Storage setup.
@Injectable()
export class ProjectMediaService {
  constructor(private readonly supabase: SupabaseService) {}

  private get bucket(): string {
    const bucket = process.env.SUPABASE_LISTING_MEDIA_BUCKET;
    if (!bucket) throw new Error('SUPABASE_LISTING_MEDIA_BUCKET must be set');
    return bucket;
  }

  async upload(userId: string, file: Express.Multer.File): Promise<{ url: string; type: 'image' | 'video' | 'document' }> {
    if (!ALLOWED_PROJECT_MEDIA_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}" — only JPEG, PNG, WEBP, HEIC images, MP4/MOV videos, or PDF documents are allowed.`,
      );
    }
    if (file.size > MAX_PROJECT_MEDIA_SIZE_BYTES) {
      throw new BadRequestException(`File exceeds the ${MAX_PROJECT_MEDIA_SIZE_BYTES / (1024 * 1024)}MB size limit.`);
    }
    const extension = EXTENSION_BY_MIME_TYPE[file.mimetype];
    const path = `projects/${userId}/${randomUUID()}.${extension}`;
    const { error } = await this.supabase.client.storage.from(this.bucket).upload(path, file.buffer, { contentType: file.mimetype });
    if (error) throw error;
    const {
      data: { publicUrl },
    } = this.supabase.client.storage.from(this.bucket).getPublicUrl(path);
    const type = file.mimetype.startsWith('video/') ? 'video' : file.mimetype === 'application/pdf' ? 'document' : 'image';
    return { url: publicUrl, type };
  }
}
