import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../common/types';
export interface AuthenticatedUser {
    id: string;
    role: Role;
    agentId?: string;
}
declare module 'express' {
    interface Request {
        user?: AuthenticatedUser;
    }
}
export declare class JwtAuthGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    private jwks;
    canActivate(context: ExecutionContext): Promise<boolean>;
    private verify;
    private extractToken;
}
