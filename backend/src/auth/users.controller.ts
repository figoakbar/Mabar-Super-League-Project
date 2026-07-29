import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Query,
} from "@nestjs/common";
import { IsIn, IsOptional, IsString } from "class-validator";

import { PrismaService } from "../prisma/prisma.service";
import { CurrentUser, Roles } from "./auth.decorators";
import { toPublicUser, type PublicUser } from "./auth.service";

class UpdateUserDto {
  @IsOptional()
  @IsIn(["user", "admin"])
  role?: string;

  @IsOptional()
  @IsString()
  username?: string;
}

/** Admin-only account management. */
@Roles("admin")
@Controller("users")
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Query("q") q?: string) {
    const term = q?.trim();
    const rows = await this.prisma.user.findMany({
      where: term
        ? {
            OR: [
              { email: { contains: term } },
              { username: { contains: term } },
            ],
          }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { sessions: true } } },
    });
    return rows.map((u) => ({
      ...toPublicUser(u),
      activeSessions: u._count.sessions,
    }));
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor?: PublicUser,
  ) {
    // Losing your own admin rights would lock you out of this very page.
    if (actor?.id === id && dto.role && dto.role !== "admin") {
      throw new BadRequestException("You cannot remove your own admin role");
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.role ? { role: dto.role } : {}),
        ...(dto.username ? { username: dto.username.trim() } : {}),
      },
    });
    return toPublicUser(user);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() actor?: PublicUser) {
    if (actor?.id === id) {
      throw new ForbiddenException("You cannot delete your own account here");
    }
    await this.prisma.user.delete({ where: { id } });
    return { id, deleted: true };
  }
}
