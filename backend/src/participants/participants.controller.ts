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

import { CurrentUser, Public, Roles } from "../auth/auth.decorators";
import type { PublicUser } from "../auth/auth.service";
import {
  CreateParticipantDto,
  UpdateParticipantDto,
} from "./dto/participant.dto";
import { ParticipantsService } from "./participants.service";
import { receiptUploadOptions } from "./receipts";

/** Multer has already written an accepted file; a refused request must not keep it. */
async function discard(file?: Express.Multer.File) {
  if (file) await unlink(file.path).catch(() => undefined);
}

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
   * under someone else's name or self-confirm their own payment. The payment
   * receipt travels in the same multipart request (field `receipt`), so a
   * refused file means no registration either. An admin seeding a bracket by
   * hand may name the entrant and set the status, and sends plain JSON.
   */
  @Post()
  @UseInterceptors(FileInterceptor("receipt", receiptUploadOptions))
  async create(
    @Body() dto: CreateParticipantDto,
    @CurrentUser() user: PublicUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      const isAdmin = user.role === "admin";
      // A player must finish the profile step (username, phone, gamer IDs,
      // consent) before entering a bracket; opponents need those to find them.
      if (!isAdmin && !user.profileComplete) {
        throw new ForbiddenException(
          "Complete your profile before registering for a tournament",
        );
      }
      return await this.participants.create(
        {
          ...dto,
          team: isAdmin && dto.team?.trim() ? dto.team.trim() : user.username,
          captain: isAdmin && dto.captain ? dto.captain : user.username,
          status: isAdmin && dto.status ? dto.status : undefined,
        },
        user,
        file?.filename,
      );
    } catch (err) {
      await discard(file);
      throw err;
    }
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

  /** Replace the payment receipt on a registration (JPG/PNG/WEBP/GIF/PDF, max 5 MB). */
  @Post(":id/receipt")
  @UseInterceptors(FileInterceptor("file", receiptUploadOptions))
  async uploadReceipt(
    @Param("id") id: string,
    @CurrentUser() user: PublicUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("No file uploaded");
    try {
      return await this.participants.setReceipt(id, file.filename, user);
    } catch (err) {
      // Someone else's registration, or an unknown id.
      await discard(file);
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
