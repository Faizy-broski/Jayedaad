"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.enableCors();
    const port = process.env.PORT ? Number(process.env.PORT) : 3001;
    await app.listen(port);
    // eslint-disable-next-line no-console
    console.log(`Jayedaad API listening on http://localhost:${port}`);
}
bootstrap();
