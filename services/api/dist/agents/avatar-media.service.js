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
exports.AvatarMediaService = exports.MAX_AVATAR_SIZE_BYTES = exports.ALLOWED_AVATAR_MIME_TYPES = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const supabase_service_1 = require("../supabase/supabase.service");
// Profile pictures — own bucket, separate from listing-media (which is for
// listing photos/videos and allows video MIME types this doesn't need).
// PUBLIC bucket: avatars are meant to be publicly viewable, so uploads
// resolve to plain public URLs, same as listing-media.
exports.ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
exports.MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const EXTENSION_BY_MIME_TYPE = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
};
let AvatarMediaService = class AvatarMediaService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    get bucket() {
        const bucket = process.env.SUPABASE_AVATARS_BUCKET;
        if (!bucket)
            throw new Error('SUPABASE_AVATARS_BUCKET must be set');
        return bucket;
    }
    async upload(pathPrefix, file) {
        if (!exports.ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`Unsupported file type "${file.mimetype}" — only JPEG, PNG, WEBP, or HEIC images are allowed.`);
        }
        if (file.size > exports.MAX_AVATAR_SIZE_BYTES) {
            throw new common_1.BadRequestException(`File exceeds the ${exports.MAX_AVATAR_SIZE_BYTES / (1024 * 1024)}MB size limit.`);
        }
        const extension = EXTENSION_BY_MIME_TYPE[file.mimetype];
        const path = `${pathPrefix}/${(0, crypto_1.randomUUID)()}.${extension}`;
        const { error } = await this.supabase.client.storage
            .from(this.bucket)
            .upload(path, file.buffer, { contentType: file.mimetype });
        if (error)
            throw error;
        const { data: { publicUrl }, } = this.supabase.client.storage.from(this.bucket).getPublicUrl(path);
        return publicUrl;
    }
};
exports.AvatarMediaService = AvatarMediaService;
exports.AvatarMediaService = AvatarMediaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], AvatarMediaService);
