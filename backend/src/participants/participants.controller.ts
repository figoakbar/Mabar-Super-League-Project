import { randomUUID } from "node:crypto";
import { extname } from "node:path";

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";

import { CurrentUser, Public, Roles } from "../auth/auth.decorators";
import type { PublicUser } from "../auth/auth.service";
import {
  CreateParticipantDto,
  UpdateParticipantDto,
} from "./dto/participant.dto";
import { ParticipantsService } from "./participants.service";

const ALLOWED = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/;

@Controller("participants")
export class ParticipantsController {
  constructor(private readonly participants: ParticipantsService) {}

  @Public()
  @Get()
  findAll(
    @Query("tournamentId") tournamentId?: string,
    @Query("team") team?: string,
  ) {
    return this.participants.findAll(tournamentId, team);
  }

  /**
   * Registration.
   *
   * For a normal player this is *self*-registration: the entrant and the initial
   * status come from the session, never the request body, so nobody can enter
   * under someone else's name or self-confirm their own payment. An admin
   * seeding a bracket by hand may name the entrant and set the status.
   */
  @Post()
  create(@Body() dto: CreateParticipantDto, @CurrentUser() user: PublicUser) {
    const isAdmin = user.role === "admin";
    return this.participants.create({
      ...dto,
      team: isAdmin && dto.team?.trim() ? dto.team.trim() : user.username,
      captain: isAdmin && dto.captain ? dto.captain : user.username,
      status: isAdmin && dto.status ? dto.status : "pending",
    });
  }

  @Roles("admin")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateParticipantDto) {
    return this.participants.update(id, dto);
  }

  /** Upload the payment receipt for a registration (JPG/PNG/WEBP/GIF/PDF, max 5 MB). */
  @Post(":id/receipt")
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (_req, file, cb) =>
          cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) =>
        ALLOWED.test(file.mimetype)
          ? cb(null, true)
          : cb(new BadRequestException("Only JPG, PNG, WEBP, GIF or PDF"), false),
    }),
  )
  uploadReceipt(
    @Param("id") id: string,
    @CurrentUser() user: PublicUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    return this.participants.setReceipt(
      id,
      `/uploads/${file.filename}`,
      user.role === "admin" ? undefined : user.username,
    );
  }

  @Roles("admin")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.participants.remove(id);
  }
}
