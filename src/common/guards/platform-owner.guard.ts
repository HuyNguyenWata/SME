import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { AuthUser } from '../types/auth-user.type';

/**
 * Restricts an endpoint to the platform owner(s) listed in PLATFORM_OWNER_EMAILS
 * (comma-separated). Unlike @Roles('ADMIN'), which every store owner has, this
 * guard is for platform-wide settings (e.g. the single shared Meta App config)
 * that must not be editable by individual store owners.
 */
@Injectable()
export class PlatformOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const email = request.user?.email?.toLowerCase();
    if (!email) return false;

    const ownerEmails = (process.env.PLATFORM_OWNER_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    return ownerEmails.includes(email);
  }
}
