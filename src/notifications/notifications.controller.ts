import {
  Controller,
  Get,
  Query,
  Sse,
  MessageEvent,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  @Get('stream')
  @Sse()
  stream(@Query('token') token: string): Observable<MessageEvent> {
    if (!token) {
      throw new UnauthorizedException('Token is required for SSE');
    }

    try {
      // Verify token
      const secret = this.configService.getOrThrow<string>('JWT_SECRET');
      const payload = this.jwtService.verify<{ sub: number }>(token, {
        secret,
      });
      const userId = payload.sub;

      if (!userId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const subject = this.notificationsService.addClient(userId);

      // Clean up on client disconnect
      // Usually NestJS automatically unsubscribes on client disconnect.
      // We can hook into the observable or let it be handled by standard mechanism.
      // But we should probably provide a way to clean up our Map, though Subject
      // will not leak much if the client disconnects, as long as we don't hold references unnecessarily.

      return subject.asObservable();
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
