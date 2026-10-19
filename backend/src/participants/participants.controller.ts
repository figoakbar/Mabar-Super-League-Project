import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";

import {
  BadRequestException,
  Body,
  ForbiddenException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import { diskStorage } from "multer";

import { CurrentUser, Public, Roles } from "../auth/auth.decorators";
import type { PublicUser } from "../auth/auth.service";
import {
  CreateParticipantDto,
  UpdateParticipantDto,
} from "./dto/participant.dto";
import { ParticipantsService } from "./participants.service";
import { ensureReceiptsDir, RECEIPT_TYPES } from "./receipts";

@Controller("participants")
export class ParticipantsController {
  constructor(private readonly participants: ParticipantsService) {}

  @Public()
  @Get()
  findAll(
    @Query("tournamentId") tournamentId?: string,
    @Query("team") team?: string,
    @CurrentUser() user?: PublicUser,
  ) {
    // Public, but personalised: an admin or the entrant also sees contact
    // details and the receipt link; everyone else only whether one exists.
    return this.participants.findAll(tournamentId, team, user);
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
    // A player must finish the profile step (username, phone, gamer IDs,
    // consent) before entering a bracket; opponents need those to find them.
    if (!isAdmin && !user.profileComplete) {
      throw new ForbiddenException(
        "Complete your profile before registering for a tournament",
      );
    }
    return this.participants.create({
      ...dto,
      team: isAdmin && dto.team?.trim() ? dto.team.trim() : user.username,
      captain: isAdmin && dto.captain ? dto.captain : user.username,
      status: isAdmin && dto.status ? dto.status : "pending",
    }, user);
  }

  @Roles("admin")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateParticipantDto,
    @CurrentUser() user: PublicUser,
  ) {
    return this.participants.update(id, dto, user);
  }

  /** Upload the payment receipt for a registration (JPG/PNG/WEBP/GIF/PDF, max 5 MB). */
  @Post(":id/receipt")
  @UseInterceptors(
    FileInterceptor("file", {
      // Private folder, never served statically — see receipts.ts.
      storage: diskStorage({
        destination: (_req, _file, cb) => cb(null, ensureReceiptsDir()),
        filename: (_req, file, cb) =>
          cb(null, `${randomUUID()}${RECEIPT_TYPES[file.mimetype]}`),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) =>
        file.mimetype in RECEIPT_TYPES
          ? cb(null, true)
          : cb(new BadRequestException("Only JPG, PNG, WEBP, GIF or PDF"), false),
    }),
  )
  async uploadReceipt(
    @Param("id") id: string,
    @CurrentUser() user: PublicUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    try {
      return await this.participants.setReceipt(id, file.filename, user);
    } catch (err) {
      // Multer has already written the file by now; a refused upload (someone
      // else's registration, an unknown id) must not leave it behind.
      await unlink(file.path).catch(() => undefined);
      throw err;
    }
  }

  /** The receipt itself — for an admin or the entrant who uploaded it. */
  @Get(":id/receipt")
  async receipt(
    @Param("id") id: string,
    @CurrentUser() user: PublicUser,
    @Res() res: Response,
  ) {
    const file = await this.participants.receiptFile(id, user);
    res.set({
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    });
    res.sendFile(file);
  }

  @Roles("admin")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.participants.remove(id);
  }
}
