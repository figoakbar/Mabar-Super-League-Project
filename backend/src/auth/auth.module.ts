import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { MailService } from "./mail.service";
import { UsersController } from "./users.controller";

@Module({
  imports: [PrismaModule],
  controllers: [AuthController, UsersController],
  providers: [AuthService, MailService],
  // AuthService is exported so the global AuthGuard can resolve sessions.
  exports: [AuthService],
})
export class AuthModule {}
