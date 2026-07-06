import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { parseId } from '../common/utils/id.util';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { Request as ExpressRequest } from 'express';

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
  // SEND MESSAGE
  // =========================
  @Post('conversations/:id/messages')
  @ApiOperation({
    summary: 'Send chat message and generate assistant response',
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

  @Get('conversations/:id')
  conversation(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.chat.conversation(parseId(id), req.user.id);
  }

  // =========================
  // DELETE CONVERSATION
  // =========================
  @Delete('conversations/:id')
  removeConversation(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.chat.removeConversation(parseId(id));
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get chat analytics' })
  analytics(@Query('days') days = '30') {
    return this.chat.chatAnalytics(Number(days));
  }
}
