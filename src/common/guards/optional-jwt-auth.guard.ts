import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Return the user if authentication succeeds, otherwise return null
    // We don't throw an error here so the route handler can decide what to do
    return user || null;
  }
}
