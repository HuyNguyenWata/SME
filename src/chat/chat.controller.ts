import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Request,
  Res,
  Headers,
  UnauthorizedException,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiHeader,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { parseId } from '../common/utils/id.util';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import type { Request as ExpressRequest } from 'express';

// =========================
// TYPE REQUEST (FIX ESLINT)
// =========================
interface AuthRequest extends ExpressRequest {
  user?: {
    id: number;
    email: string;
  };
}

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(OptionalJwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  private validateAuth(req: AuthRequest, guestId?: string) {
    if (!req.user?.id && !guestId) {
      throw new UnauthorizedException('Authentication or guest ID required');
    }
    return { userId: req.user?.id, guestId };
  }

  // =========================
  // GET CONVERSATIONS
  // =========================
  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  @ApiHeader({
    name: 'x-guest-id',
    required: false,
    description: 'Guest Session ID',
  })
  conversations(
    @Request() req: AuthRequest,
    @Headers('x-guest-id') guestId?: string,
  ) {
    const { userId } = this.validateAuth(req, guestId);
    return this.chat.conversations(userId, guestId);
  }

  // =========================
  // CREATE CONVERSATION
  // =========================
  @Post('conversations')
  @ApiOperation({ summary: 'Create conversation' })
  @ApiHeader({ name: 'x-guest-id', required: false })
  createConversation(
    @Request() req: AuthRequest,
    @Body() dto: CreateConversationDto,
    @Headers('x-guest-id') headerGuestId?: string,
  ) {
    const { userId, guestId } = this.validateAuth(req, headerGuestId);
    return this.chat.createConversation({
      ...dto,
      userId,
      guestId,
    });
  }

  // =========================
  // SEND MESSAGE (NON-STREAM)
  // =========================
  @Post('conversations/:id/messages')
  @ApiOperation({
    summary: 'Send chat message and get AI response',
  })
  @ApiHeader({ name: 'x-guest-id', required: false })
  send(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Headers('x-guest-id') headerGuestId?: string,
  ) {
    const { userId, guestId } = this.validateAuth(req, headerGuestId);
    return this.chat.send(parseId(id), {
      ...dto,
      userId,
      guestId,
    });
  }

  // =========================
  // SEND MESSAGE (SSE STREAM)
  // =========================
  @Post('conversations/:id/messages/stream')
  @ApiOperation({
    summary: 'Send chat message and stream AI response (SSE)',
  })
  @ApiHeader({ name: 'x-guest-id', required: false })
  async sendStream(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
    @Headers('x-guest-id') headerGuestId?: string,
  ) {
    const { userId, guestId } = this.validateAuth(req, headerGuestId);
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const conversationId = parseId(id);

    try {
      const stream = this.chat.sendStream(conversationId, {
        ...dto,
        userId,
        guestId,
      });

      for await (const chunk of stream) {
        res.write(chunk);
        const resWithFlush = res as unknown as { flush?: () => void };
        if (typeof resWithFlush.flush === 'function') {
          resWithFlush.flush();
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      res.write(
        `data: ${JSON.stringify({ content: errorMsg, done: true, is_error: true })}\n\n`,
      );
    } finally {
      res.end();
    }
  }

  // =========================
  // GET SINGLE CONVERSATION
  // =========================
  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get single conversation with messages' })
  @ApiHeader({ name: 'x-guest-id', required: false })
  conversation(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Headers('x-guest-id') headerGuestId?: string,
  ) {
    const { userId, guestId } = this.validateAuth(req, headerGuestId);
    return this.chat.conversation(parseId(id), userId, guestId);
  }

  // =========================
  // UPDATE CONVERSATION
  // =========================
  @Patch('conversations/:id')
  @ApiOperation({ summary: 'Update conversation (e.g. clear context product)' })
  @ApiHeader({ name: 'x-guest-id', required: false })
  updateConversation(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
    @Headers('x-guest-id') headerGuestId?: string,
  ) {
    const { userId, guestId } = this.validateAuth(req, headerGuestId);
    return this.chat.updateConversation(userId, guestId, parseId(id), dto);
  }

  // =========================
  // DELETE CONVERSATION
  // =========================
  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete conversation' })
  @ApiHeader({ name: 'x-guest-id', required: false })
  removeConversation(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Headers('x-guest-id') headerGuestId?: string,
  ) {
    const { userId, guestId } = this.validateAuth(req, headerGuestId);
    return this.chat.removeConversation(parseId(id), userId, guestId);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get chat analytics' })
  analytics(@Request() req: AuthRequest, @Query('days') days = '30') {
    if (!req.user?.id) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.chat.chatAnalytics(req.user.id, Number(days));
  }
}
