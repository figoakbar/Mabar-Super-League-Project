import { Controller, Get } from "@nestjs/common";

import { Public } from "../auth/auth.decorators";
import { PlayersService } from "./players.service";

/** Public player directory shown at /players. Read-only, no auth required. */
@Controller("players")
export class PlayersController {
  constructor(private readonly players: PlayersService) {}

  @Public()
  @Get()
  findAll() {
    return this.players.findAll();
  }
}
