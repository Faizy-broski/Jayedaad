"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const all_exceptions_filter_1 = require("./common/filters/all-exceptions.filter");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter());
    app.use((0, helmet_1.default)());
    // Mobile isn't subject to CORS (native fetch, no browser Origin
    // enforcement) — this allow-list is only relevant to apps/web. Falls back
    // to localhost:3000 so local dev keeps working if CORS_ALLOWED_ORIGINS
    // isn't set yet, but warns since that fallback is dev-only, never prod-safe.
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim());
    if (!allowedOrigins) {
        logger.warn('CORS_ALLOWED_ORIGINS not set — defaulting to http://localhost:3000 (dev only, not safe for prod)');
    }
    app.enableCors({ origin: allowedOrigins ?? ['http://localhost:3000'] });
    const port = process.env.PORT ? Number(process.env.PORT) : 3001;
    await app.listen(port);
    logger.log(`Jayedaad API listening on http://localhost:${port}`);
}
bootstrap();
