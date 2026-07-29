import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";

import { AppController } from "./app.controller";
import { AuthGuard } from "./auth/auth.guard";
import { AuthModule } from "./auth/auth.module";
import { MatchesModule } from "./matches/matches.module";
import { ParticipantsModule } from "./participants/participants.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RaceResultsModule } from "./race-results/race-results.module";
import { ReportsModule } from "./reports/reports.module";
import { TournamentsModule } from "./tournaments/tournaments.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    TournamentsModule,
    ParticipantsModule,
    MatchesModule,
    RaceResultsModule,
    ReportsModule,
  ],
  controllers: [AppController],
  // Routes are closed by default; handlers opt out with @Public().
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
