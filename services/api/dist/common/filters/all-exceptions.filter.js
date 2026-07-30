"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
// Catches everything Nest's default handler would otherwise turn into an
// unstructured response — HttpExceptions (thrown deliberately, e.g.
// BadRequestException) keep their status/message; anything else (raw
// Supabase/Postgrest errors bubbling up from repositories, unexpected bugs)
// becomes a generic 500 to the client, with the real error only ever logged
// server-side — never leak DB error details (column names, constraints) to
// callers.
let AllExceptionsFilter = class AllExceptionsFilter {
    logger = new common_1.Logger('ExceptionsFilter');
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const isHttpException = exception instanceof common_1.HttpException;
        const status = isHttpException ? exception.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const body = {
            statusCode: status,
            message: isHttpException ? extractMessage(exception) : 'Internal server error',
            error: isHttpException ? exception.name : 'InternalServerError',
            timestamp: new Date().toISOString(),
            path: request.url,
        };
        const logLine = `${request.method} ${request.url} -> ${status}`;
        if (status >= 500) {
            this.logger.error(logLine, exception instanceof Error ? exception.stack : String(exception));
        }
        else {
            this.logger.warn(logLine);
        }
        response.status(status).json(body);
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
function extractMessage(exception) {
    const response = exception.getResponse();
    if (typeof response === 'string')
        return response;
    if (response && typeof response === 'object' && 'message' in response) {
        const message = response.message;
        return Array.isArray(message) ? message.join(', ') : String(message);
    }
    return exception.message;
}
