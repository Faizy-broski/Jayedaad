"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListingMediaService = exports.MAX_LISTING_MEDIA_SIZE_BYTES = exports.ALLOWED_LISTING_MEDIA_MIME_TYPES = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const supabase_service_1 = require("../supabase/supabase.service");
// Photos/videos for a listing being drafted — uploaded as they're picked on
// the submit form, before the listing itself exists (see
// CreateListingDto.media). Unlike documents.service.ts's private bucket,
// this one is PUBLIC: listing photos are meant to be publicly viewable, so
// uploads resolve to plain public URLs, no signed-URL step needed on read.
exports.ALLOWED_LISTING_MEDIA_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'video/mp4',
    'video/quicktime',
];
exports.MAX_LISTING_MEDIA_SIZE_BYTES = 30 * 1024 * 1024;
const EXTENSION_BY_MIME_TYPE = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov',
};
let ListingMediaService = class ListingMediaService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    get bucket() {
        const bucket = process.env.SUPABASE_LISTING_MEDIA_BUCKET;
        if (!bucket)
            throw new Error('SUPABASE_LISTING_MEDIA_BUCKET must be set');
        return bucket;
    }
    async upload(userId, file) {
        if (!exports.ALLOWED_LISTING_MEDIA_MIME_TYPES.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`Unsupported file type "${file.mimetype}" — only JPEG, PNG, WEBP, HEIC images or MP4/MOV videos are allowed.`);
        }
        if (file.size > exports.MAX_LISTING_MEDIA_SIZE_BYTES) {
            throw new common_1.BadRequestException(`File exceeds the ${exports.MAX_LISTING_MEDIA_SIZE_BYTES / (1024 * 1024)}MB size limit.`);
        }
        const extension = EXTENSION_BY_MIME_TYPE[file.mimetype];
        const path = `${userId}/${(0, crypto_1.randomUUID)()}.${extension}`;
        const { error } = await this.supabase.client.storage
            .from(this.bucket)
            .upload(path, file.buffer, { contentType: file.mimetype });
        if (error)
            throw error;
        const { data: { publicUrl }, } = this.supabase.client.storage.from(this.bucket).getPublicUrl(path);
        return { url: publicUrl, type: file.mimetype.startsWith('video/') ? 'video' : 'image' };
    }
};
exports.ListingMediaService = ListingMediaService;
exports.ListingMediaService = ListingMediaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], ListingMediaService);
