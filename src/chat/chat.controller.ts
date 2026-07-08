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
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
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
  user: {
    id: number;
    email: string;
  };
}

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  // =========================
  // GET CONVERSATIONS
  // =========================
  @Get('conversations')
  @ApiOperation({ summary: 'Get user conversations' })
  conversations(@Request() req: AuthRequest) {
    return this.chat.conversations(req.user.id);
  }

  // =========================
  // CREATE CONVERSATION
  // =========================
  @Post('conversations')
  @ApiOperation({ summary: 'Create conversation' })
  createConversation(
    @Request() req: AuthRequest,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chat.createConversation({
      ...dto,
      userId: req.user.id,
    });
  }

  // =========================
  // SEND MESSAGE (NON-STREAM)
  // =========================
  @Post('conversations/:id/messages')
  @ApiOperation({
    summary: 'Send chat message and get AI response',
  })
  send(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chat.send(parseId(id), {
      ...dto,
      userId: req.user.id,
    });
  }

  // =========================
  // SEND MESSAGE (SSE STREAM)
  // =========================
  @Post('conversations/:id/messages/stream')
  @ApiOperation({
    summary: 'Send chat message and stream AI response (SSE)',
  })
  async sendStream(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ) {
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
        userId: req.user.id,
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
  conversation(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.chat.conversation(parseId(id), req.user.id);
  }

  // =========================
  // UPDATE CONVERSATION
  // =========================
  @Patch('conversations/:id')
  @ApiOperation({ summary: 'Update conversation (e.g. clear context product)' })
  updateConversation(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.chat.updateConversation(req.user.id, parseId(id), dto);
  }

  // =========================
  // DELETE CONVERSATION
  // =========================
  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete conversation' })
  removeConversation(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.chat.removeConversation(parseId(id));
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get chat analytics' })
  analytics(@Query('days') days = '30') {
    return this.chat.chatAnalytics(Number(days));
  }
}
