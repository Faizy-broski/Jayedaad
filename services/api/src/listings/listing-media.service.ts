import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';

// Photos/videos for a listing being drafted — uploaded as they're picked on
// the submit form, before the listing itself exists (see
// CreateListingDto.media). Unlike documents.service.ts's private bucket,
// this one is PUBLIC: listing photos are meant to be publicly viewable, so
// uploads resolve to plain public URLs, no signed-URL step needed on read.
export const ALLOWED_LISTING_MEDIA_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'video/mp4',
  'video/quicktime',
];
export const MAX_LISTING_MEDIA_SIZE_BYTES = 30 * 1024 * 1024;

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

@Injectable()
export class ListingMediaService {
  constructor(private readonly supabase: SupabaseService) {}

  private get bucket(): string {
    const bucket = process.env.SUPABASE_LISTING_MEDIA_BUCKET;
    if (!bucket) throw new Error('SUPABASE_LISTING_MEDIA_BUCKET must be set');
    return bucket;
  }

  async upload(userId: string, file: Express.Multer.File): Promise<{ url: string; type: 'image' | 'video' }> {
    if (!ALLOWED_LISTING_MEDIA_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Unsupported file type "${file.mimetype}" — only JPEG, PNG, WEBP, HEIC images or MP4/MOV videos are allowed.`,
      );
    }
    if (file.size > MAX_LISTING_MEDIA_SIZE_BYTES) {
      throw new BadRequestException(`File exceeds the ${MAX_LISTING_MEDIA_SIZE_BYTES / (1024 * 1024)}MB size limit.`);
    }

    const extension = EXTENSION_BY_MIME_TYPE[file.mimetype];
    const path = `${userId}/${randomUUID()}.${extension}`;

    const { error } = await this.supabase.client.storage
      .from(this.bucket)
      .upload(path, file.buffer, { contentType: file.mimetype });
    if (error) throw error;

    const {
      data: { publicUrl },
    } = this.supabase.client.storage.from(this.bucket).getPublicUrl(path);

    return { url: publicUrl, type: file.mimetype.startsWith('video/') ? 'video' : 'image' };
  }
}
