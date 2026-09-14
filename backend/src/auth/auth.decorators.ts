import { createParamDecorator, SetMetadata } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { Request } from "express";

import type { PublicUser } from "./auth.service";

export const IS_PUBLIC_KEY = "msl:isPublic";
export const ROLES_KEY = "msl:roles";

/** Marks a route as reachable without a session. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restricts a route to the given roles (e.g. `@Roles("admin")`). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export type RequestWithUser = Request & { user?: PublicUser };

/** Injects the authenticated user resolved by AuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): PublicUser | undefined =>
    ctx.switchToHttp().getRequest<RequestWithUser>().user,
);
