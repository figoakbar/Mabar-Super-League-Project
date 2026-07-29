import { join } from "node:path";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix("api");

  // Uploaded payment receipts, served at /uploads/<file> (outside the /api prefix).
  app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads" });

  const allowList = (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  // Outside production, also accept any localhost / private-network origin so
  // that a changed dev port (or testing from a phone on the LAN) doesn't need
  // a config edit. Production stays strict: only CORS_ORIGIN is allowed.
  const devOrigin =
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/;
  const isProd = process.env.NODE_ENV === "production";

  app.enableCors({
    origin(origin, callback) {
      // Non-browser clients (curl, server-side fetch) send no Origin.
      if (!origin) return callback(null, true);
      if (allowList.includes("*") || allowList.includes(origin)) {
        return callback(null, true);
      }
      if (!isProd && devOrigin.test(origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`[backend] API listening on http://localhost:${port}/api`);

  // Surface the auth configuration at boot — a missing ADMIN_EMAILS is the most
  // common reason /admin stays locked after signing in.
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").filter(Boolean);
  console.log(
    admins.length
      ? `[backend] admin emails: ${admins.join(", ")}`
      : "[backend] ADMIN_EMAILS is empty — no account will be granted admin",
  );
  if (!process.env.INTERNAL_API_KEY) {
    console.warn("[backend] INTERNAL_API_KEY is not set — Google sign-in is disabled");
  }
}

void bootstrap();
