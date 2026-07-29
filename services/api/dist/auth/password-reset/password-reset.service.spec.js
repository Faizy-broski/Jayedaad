"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const password_reset_service_1 = require("./password-reset.service");
function hashCode(code) {
    return (0, crypto_1.createHash)('sha256').update(code).digest('hex');
}
describe('PasswordResetService', () => {
    function makeService(repoOverrides = {}, updateUserById = jest.fn().mockResolvedValue({ error: null })) {
        const repo = {
            findUserIdByEmail: jest.fn().mockResolvedValue('u1'),
            insertCode: jest.fn().mockResolvedValue(undefined),
            findLatestActive: jest.fn(),
            incrementAttempt: jest.fn().mockResolvedValue(undefined),
            markConsumed: jest.fn().mockResolvedValue(undefined),
            ...repoOverrides,
        };
        const mailer = {
            sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
        };
        const supabase = {
            client: { auth: { admin: { updateUserById } } },
        };
        return { service: new password_reset_service_1.PasswordResetService(repo, mailer, supabase), repo, mailer, updateUserById };
    }
    describe('requestReset', () => {
        it('sends a code and returns {sent:true} when the email matches an account', async () => {
            const { service, repo, mailer } = makeService();
            const result = await service.requestReset('user@example.com');
            expect(result).toEqual({ sent: true });
            expect(repo.insertCode).toHaveBeenCalledWith('u1', expect.any(String), expect.any(Date), 'password_reset');
            expect(mailer.sendPasswordResetEmail).toHaveBeenCalledWith('user@example.com', expect.stringMatching(/^\d{6}$/));
        });
        it('returns the same {sent:true} without emailing anything when no account matches (anti-enumeration)', async () => {
            const { service, repo, mailer } = makeService({ findUserIdByEmail: jest.fn().mockResolvedValue(null) });
            const result = await service.requestReset('nobody@example.com');
            expect(result).toEqual({ sent: true });
            expect(repo.insertCode).not.toHaveBeenCalled();
            expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled();
        });
    });
    describe('confirmReset', () => {
        it('rejects with the same generic error when no account matches the email', async () => {
            const { service } = makeService({ findUserIdByEmail: jest.fn().mockResolvedValue(null) });
            await expect(service.confirmReset('nobody@example.com', '123456', 'newpassword1')).rejects.toThrow(common_1.BadRequestException);
        });
        it('rejects an expired code', async () => {
            const { service } = makeService({
                findLatestActive: jest.fn().mockResolvedValue({
                    id: 'row1',
                    code_hash: hashCode('123456'),
                    expires_at: new Date(Date.now() - 1000).toISOString(),
                    attempt_count: 0,
                    max_attempts: 5,
                }),
            });
            await expect(service.confirmReset('user@example.com', '123456', 'newpassword1')).rejects.toThrow(common_1.BadRequestException);
        });
        it('rejects once max attempts are reached, before checking the code', async () => {
            const { service, repo } = makeService({
                findLatestActive: jest.fn().mockResolvedValue({
                    id: 'row1',
                    code_hash: hashCode('123456'),
                    expires_at: new Date(Date.now() + 60_000).toISOString(),
                    attempt_count: 5,
                    max_attempts: 5,
                }),
            });
            await expect(service.confirmReset('user@example.com', '123456', 'newpassword1')).rejects.toThrow(common_1.ForbiddenException);
            expect(repo.incrementAttempt).not.toHaveBeenCalled();
        });
        it('rejects a wrong code without touching the password', async () => {
            const { service, repo, updateUserById } = makeService({
                findLatestActive: jest.fn().mockResolvedValue({
                    id: 'row1',
                    code_hash: hashCode('123456'),
                    expires_at: new Date(Date.now() + 60_000).toISOString(),
                    attempt_count: 0,
                    max_attempts: 5,
                }),
            });
            await expect(service.confirmReset('user@example.com', '000000', 'newpassword1')).rejects.toThrow(common_1.BadRequestException);
            expect(repo.incrementAttempt).toHaveBeenCalledWith('row1');
            expect(repo.markConsumed).not.toHaveBeenCalled();
            expect(updateUserById).not.toHaveBeenCalled();
        });
        it('consumes the code and updates the password via the Admin API on a correct code', async () => {
            const { service, repo, updateUserById } = makeService({
                findLatestActive: jest.fn().mockResolvedValue({
                    id: 'row1',
                    code_hash: hashCode('123456'),
                    expires_at: new Date(Date.now() + 60_000).toISOString(),
                    attempt_count: 0,
                    max_attempts: 5,
                }),
            });
            const result = await service.confirmReset('user@example.com', '123456', 'newpassword1');
            expect(result).toEqual({ reset: true });
            expect(repo.markConsumed).toHaveBeenCalledWith('row1');
            expect(updateUserById).toHaveBeenCalledWith('u1', { password: 'newpassword1' });
        });
    });
});
