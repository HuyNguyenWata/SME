import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface NotificationEvent {
  type: string;
  data: unknown;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // Map of userId to Subject
  private readonly clients = new Map<number, Subject<MessageEvent>>();

  addClient(userId: number): Subject<MessageEvent> {
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Subject<MessageEvent>());
      this.logger.log(`Client added for user ${userId}`);
    }
    return this.clients.get(userId)!;
  }

  removeClient(userId: number) {
    const subject = this.clients.get(userId);
    if (subject) {
      subject.complete();
      this.clients.delete(userId);
      this.logger.log(`Client removed for user ${userId}`);
    }
  }

  sendToUser(userId: number, event: NotificationEvent) {
    const subject = this.clients.get(userId);
    if (subject) {
      subject.next({
        data: event.data,
        type: event.type,
      } as MessageEvent);
      this.logger.log(`Event ${event.type} sent to user ${userId}`);
    } else {
      this.logger.warn(
        `User ${userId} is not connected, cannot send event ${event.type}`,
      );
    }
  }
}
