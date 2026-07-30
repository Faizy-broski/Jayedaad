"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const otp_service_1 = require("./otp.service");
function hashCode(code) {
    return (0, crypto_1.createHash)('sha256').update(code).digest('hex');
}
describe('OtpService', () => {
    function makeService(repoOverrides = {}) {
        const repo = {
            getEmailVerified: jest.fn().mockResolvedValue(false),
            getEmail: jest.fn().mockResolvedValue('user@example.com'),
            insertCode: jest.fn().mockResolvedValue(undefined),
            findLatestActive: jest.fn(),
            incrementAttempt: jest.fn().mockResolvedValue(undefined),
            markConsumed: jest.fn().mockResolvedValue(undefined),
            markEmailVerified: jest.fn().mockResolvedValue(undefined),
            ...repoOverrides,
        };
        const mailer = { sendOtpEmail: jest.fn().mockResolvedValue(undefined) };
        return { service: new otp_service_1.OtpService(repo, mailer), repo, mailer };
    }
    describe('sendCode', () => {
        it('rejects if the email is already verified', async () => {
            const { service, repo } = makeService({ getEmailVerified: jest.fn().mockResolvedValue(true) });
            await expect(service.sendCode('u1')).rejects.toThrow(common_1.BadRequestException);
            expect(repo.insertCode).not.toHaveBeenCalled();
        });
        it('generates a code, stores its hash, and emails it', async () => {
            const { service, repo, mailer } = makeService();
            const result = await service.sendCode('u1');
            expect(result).toEqual({ sent: true });
            expect(repo.insertCode).toHaveBeenCalledWith('u1', expect.any(String), expect.any(Date), 'email_verification');
            expect(mailer.sendOtpEmail).toHaveBeenCalledWith('user@example.com', expect.stringMatching(/^\d{6}$/));
        });
    });
    describe('verifyCode', () => {
        it('rejects when there is no active code', async () => {
            const { service } = makeService({ findLatestActive: jest.fn().mockResolvedValue(null) });
            await expect(service.verifyCode('u1', '123456')).rejects.toThrow(common_1.BadRequestException);
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
            await expect(service.verifyCode('u1', '123456')).rejects.toThrow(common_1.BadRequestException);
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
            await expect(service.verifyCode('u1', '123456')).rejects.toThrow(common_1.ForbiddenException);
            expect(repo.incrementAttempt).not.toHaveBeenCalled();
        });
        it('increments attempt count and rejects a wrong code', async () => {
            const { service, repo } = makeService({
                findLatestActive: jest.fn().mockResolvedValue({
                    id: 'row1',
                    code_hash: hashCode('123456'),
                    expires_at: new Date(Date.now() + 60_000).toISOString(),
                    attempt_count: 0,
                    max_attempts: 5,
                }),
            });
            await expect(service.verifyCode('u1', '000000')).rejects.toThrow(common_1.BadRequestException);
            expect(repo.incrementAttempt).toHaveBeenCalledWith('row1');
            expect(repo.markConsumed).not.toHaveBeenCalled();
        });
        it('marks the row consumed and the profile verified on a correct code', async () => {
            const { service, repo } = makeService({
                findLatestActive: jest.fn().mockResolvedValue({
                    id: 'row1',
                    code_hash: hashCode('123456'),
                    expires_at: new Date(Date.now() + 60_000).toISOString(),
                    attempt_count: 0,
                    max_attempts: 5,
                }),
            });
            const result = await service.verifyCode('u1', '123456');
            expect(result).toEqual({ verified: true });
            expect(repo.markConsumed).toHaveBeenCalledWith('row1');
            expect(repo.markEmailVerified).toHaveBeenCalledWith('u1');
        });
    });
});
