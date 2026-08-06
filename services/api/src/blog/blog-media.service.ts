import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

// Cover images — own bucket, mirrors agents/avatar-media.service.ts exactly
// (own MIME/size limits, own env-var-named bucket). PUBLIC bucket: cover
// images are meant to be publicly viewable on the blog.
export const ALLOWED_BLOG_COVER_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
export const MAX_BLOG_COVER_SIZE_BYTES = 5 * 1024 * 1024;

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

@Injectable()
export class BlogMediaService {
  constructor(private readonly supabase: SupabaseService) {}

  private get bucket(): string {
    const bucket = process.env.SUPABASE_BLOG_COVERS_BUCKET;
    if (!bucket) throw new Error('SUPABASE_BLOG_COVERS_BUCKET must be set');
    return bucket;
  }

  async upload(pathPrefix: string, file: Express.Multer.File): Promise<string> {
    if (!ALLOWED_BLOG_COVER_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}" — only JPEG, PNG, WEBP, or HEIC images are allowed.`,
      );
    }
    if (file.size > MAX_BLOG_COVER_SIZE_BYTES) {
      throw new BadRequestException(`File exceeds the ${MAX_BLOG_COVER_SIZE_BYTES / (1024 * 1024)}MB size limit.`);
    }

    const extension = EXTENSION_BY_MIME_TYPE[file.mimetype];
    const path = `${pathPrefix}/${randomUUID()}.${extension}`;

    const { error } = await this.supabase.client.storage
      .from(this.bucket)
      .upload(path, file.buffer, { contentType: file.mimetype });
    if (error) throw error;

    const {
      data: { publicUrl },
    } = this.supabase.client.storage.from(this.bucket).getPublicUrl(path);

    return publicUrl;
  }
}
