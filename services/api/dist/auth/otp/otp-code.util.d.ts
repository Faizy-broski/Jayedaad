export declare const CODE_TTL_MS: number;
export declare function generateCode(): string;
export declare function hashCode(code: string): string;
export interface OtpCodeRow {
    id: string;
    code_hash: string;
    expires_at: string;
    attempt_count: number;
    max_attempts: number;
}
export declare function assertCodeUsable(row: OtpCodeRow | null): asserts row is OtpCodeRow;
export declare function assertHashMatches(row: OtpCodeRow, submittedCode: string): void;
