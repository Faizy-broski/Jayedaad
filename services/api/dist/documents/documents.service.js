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
exports.DocumentsService = exports.MAX_DOCUMENT_SIZE_BYTES = exports.ALLOWED_DOCUMENT_MIME_TYPES = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const supabase_service_1 = require("../supabase/supabase.service");
// Real business requirement: only PNG/JPEG/PDF may be uploaded to a
// documents section — checked against the actual uploaded file's MIME type
// (this is the first real file-upload capability in this codebase; every
// existing *_url field is just a text URL the client already uploaded
// elsewhere and handed over, with no server-side content-type guarantee).
exports.ALLOWED_DOCUMENT_MIME_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];
exports.MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const EXTENSION_BY_MIME_TYPE = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'application/pdf': 'pdf',
};
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60;
// Storage mechanics only — no DB rows. Consumed by listings/agencies/agents
// repositories, which own the actual document rows and business rules
// (required-document completeness, etc).
let DocumentsService = class DocumentsService {
    supabase;
    constructor(supabase) {
        this.supabase = supabase;
    }
    get bucket() {
        const bucket = process.env.SUPABASE_DOCUMENTS_BUCKET;
        if (!bucket)
            throw new Error('SUPABASE_DOCUMENTS_BUCKET must be set');
        return bucket;
    }
    // Uploads into a PRIVATE bucket (ID cards/tax certificates are PII) —
    // returns the storage object path, not a URL. Callers persist the path,
    // then resolve a fresh signed URL at read time via getSignedUrl().
    async upload(pathPrefix, file) {
        if (!exports.ALLOWED_DOCUMENT_MIME_TYPES.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`Unsupported file type "${file.mimetype}" — only PNG, JPEG, and PDF files are allowed.`);
        }
        if (file.size > exports.MAX_DOCUMENT_SIZE_BYTES) {
            throw new common_1.BadRequestException(`File exceeds the ${exports.MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024)}MB size limit.`);
        }
        const extension = EXTENSION_BY_MIME_TYPE[file.mimetype];
        const path = `${pathPrefix}/${(0, crypto_1.randomUUID)()}.${extension}`;
        const { error } = await this.supabase.client.storage
            .from(this.bucket)
            .upload(path, file.buffer, { contentType: file.mimetype });
        if (error)
            throw error;
        return path;
    }
    async getSignedUrl(path) {
        const { data, error } = await this.supabase.client.storage
            .from(this.bucket)
            .createSignedUrl(path, SIGNED_URL_EXPIRY_SECONDS);
        if (error)
            throw error;
        return data.signedUrl;
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], DocumentsService);
