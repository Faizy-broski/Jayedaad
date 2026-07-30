"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CODE_TTL_MS = void 0;
exports.generateCode = generateCode;
exports.hashCode = hashCode;
exports.assertCodeUsable = assertCodeUsable;
exports.assertHashMatches = assertHashMatches;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
exports.CODE_TTL_MS = 10 * 60 * 1000;
function generateCode() {
    return String((0, crypto_1.randomInt)(100000, 1000000));
}
function hashCode(code) {
    return (0, crypto_1.createHash)('sha256').update(code).digest('hex');
}
// Split into two steps (not one combined check) so callers can increment the
// attempt counter *between* them — the counter must be written before the
// hash is compared, so a mid-request crash still counts the attempt. Shared
// by OtpService (email verification) and PasswordResetService, which differ
// only in what happens *after* a code is confirmed valid.
function assertCodeUsable(row) {
    if (!row) {
        throw new common_1.BadRequestException('No active code — request a new one');
    }
    if (new Date(row.expires_at).getTime() < Date.now()) {
        throw new common_1.BadRequestException('Code expired — request a new one');
    }
    if (row.attempt_count >= row.max_attempts) {
        throw new common_1.ForbiddenException('Too many attempts — request a new code');
    }
}
function assertHashMatches(row, submittedCode) {
    if (hashCode(submittedCode) !== row.code_hash) {
        throw new common_1.BadRequestException('Incorrect code');
    }
}
