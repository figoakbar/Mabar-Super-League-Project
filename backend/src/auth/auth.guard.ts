import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { AuthService, toPublicUser } from "./auth.service";
import {
  IS_PUBLIC_KEY,
  ROLES_KEY,
  type RequestWithUser,
} from "./auth.decorators";

/**
 * Global guard. Routes are closed by default: a handler must opt out with
 * `@Public()` or the caller must present a valid `Authorization: Bearer` token.
 * `@Roles("admin")` narrows it further.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const targets = [ctx.getHandler(), ctx.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      targets,
    );
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, targets);

    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    const token = bearerFrom(req.headers.authorization);

    // Public routes still resolve the user when a token is present, so handlers
    // can personalise a response without forcing a login.
    if (token) {
      const session = await this.auth.resolveSession(token);
      if (session) req.user = toPublicUser(session.user);
    }

    if (isPublic && !roles?.length) return true;

    if (!req.user) {
      throw new UnauthorizedException("Sign in to continue");
    }
    if (roles?.length && !roles.includes(req.user.role)) {
      throw new ForbiddenException("You do not have access to this resource");
    }
    return true;
  }
}

function bearerFrom(header?: string): string | null {
  if (!header) return null;
  const [scheme, value] = header.split(" ");
  return scheme?.toLowerCase() === "bearer" && value ? value.trim() : null;
}
