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
    role?: string;
    storeId?: number;
  };
}

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(OptionalJwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  private validateAuth(
    req: AuthRequest,
    guestId?: string,
    storeIdHeader?: string,
  ) {
    let finalStoreId: number | undefined;
    let finalCustomerId: number | undefined;

    // 1. If admin is logged in (role ADMIN or USER without storeId), their ID is the store ID
    if (req.user?.id && !req.user?.storeId) {
      finalStoreId = req.user.id;
    }
    // 2. If customer is logged in (role CUSTOMER, has storeId), their storeId is the store ID, and their ID is customerId
    else if (req.user?.id && req.user?.storeId) {
      finalStoreId = req.user.storeId;
      finalCustomerId = req.user.id;
    }
    // 3. If guest, they MUST provide x-store-id header
    else if (guestId && storeIdHeader) {
      finalStoreId = parseInt(storeIdHeader, 10);
    } else {
      throw new UnauthorizedException(
        'Authentication, or guest ID with store ID required',
      );
    }

    if (!finalStoreId || isNaN(finalStoreId)) {
      throw new UnauthorizedException('Store ID could not be determined');
    }

    return {
      storeId: finalStoreId,
      customerId: finalCustomerId,
      guestId: finalCustomerId ? undefined : guestId,
    };
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
  @ApiHeader({ name: 'x-store-id', required: false })
  conversations(
    @Request() req: AuthRequest,
    @Headers('x-guest-id') guestId?: string,
    @Headers('x-store-id') storeIdHeader?: string,
  ) {
    const {
      storeId,
      customerId,
      guestId: finalGuestId,
    } = this.validateAuth(req, guestId, storeIdHeader);
    return this.chat.conversations(storeId, customerId, finalGuestId);
  }

  // =========================
  // CREATE CONVERSATION
  // =========================
  @Post('conversations')
  @ApiOperation({ summary: 'Create conversation' })
  @ApiHeader({ name: 'x-store-id', required: false })
  createConversation(
    @Request() req: AuthRequest,
    @Body() dto: CreateConversationDto,
    @Headers('x-guest-id') headerGuestId?: string,
    @Headers('x-store-id') storeIdHeader?: string,
  ) {
    const { storeId, customerId, guestId } = this.validateAuth(
      req,
      headerGuestId,
      storeIdHeader,
    );
    return this.chat.createConversation({
      ...dto,
      storeId,
      customerId,
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
  @ApiHeader({ name: 'x-store-id', required: false })
  send(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Headers('x-guest-id') headerGuestId?: string,
    @Headers('x-store-id') storeIdHeader?: string,
  ) {
    const { storeId, customerId, guestId } = this.validateAuth(
      req,
      headerGuestId,
      storeIdHeader,
    );
    return this.chat.send(parseId(id), {
      ...dto,
      storeId,
      customerId,
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
  @ApiHeader({ name: 'x-store-id', required: false })
  async sendStream(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
    @Headers('x-guest-id') headerGuestId?: string,
    @Headers('x-store-id') storeIdHeader?: string,
  ) {
    const { storeId, customerId, guestId } = this.validateAuth(
      req,
      headerGuestId,
      storeIdHeader,
    );
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
        storeId,
        customerId,
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
  @ApiHeader({ name: 'x-store-id', required: false })
  conversation(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Headers('x-guest-id') headerGuestId?: string,
    @Headers('x-store-id') storeIdHeader?: string,
  ) {
    const { storeId, customerId, guestId } = this.validateAuth(
      req,
      headerGuestId,
      storeIdHeader,
    );
    return this.chat.conversation(parseId(id), storeId, customerId, guestId);
  }

  // =========================
  // UPDATE CONVERSATION
  // =========================
  @Patch('conversations/:id')
  @ApiOperation({ summary: 'Update conversation (e.g. clear context product)' })
  @ApiHeader({ name: 'x-store-id', required: false })
  updateConversation(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
    @Headers('x-guest-id') headerGuestId?: string,
    @Headers('x-store-id') storeIdHeader?: string,
  ) {
    const { storeId, customerId, guestId } = this.validateAuth(
      req,
      headerGuestId,
      storeIdHeader,
    );
    return this.chat.updateConversation(
      storeId,
      customerId,
      guestId,
      parseId(id),
      dto,
    );
  }

  // =========================
  // DELETE CONVERSATION
  // =========================
  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete conversation' })
  @ApiHeader({ name: 'x-store-id', required: false })
  removeConversation(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Headers('x-guest-id') headerGuestId?: string,
    @Headers('x-store-id') storeIdHeader?: string,
  ) {
    const { storeId, customerId, guestId } = this.validateAuth(
      req,
      headerGuestId,
      storeIdHeader,
    );
    return this.chat.removeConversation(
      parseId(id),
      storeId,
      customerId,
      guestId,
    );
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get chat analytics' })
  analytics(@Request() req: AuthRequest, @Query('days') days = '30') {
    // Only Store Owners (Users) can access analytics, Customers cannot
    if (req.user?.role === 'CUSTOMER' || req.user?.storeId) {
      throw new UnauthorizedException(
        'Customers cannot access store analytics',
      );
    }
    if (!req.user?.id) {
      throw new UnauthorizedException('User ID not found in token');
    }
    return this.chat.chatAnalytics(req.user.id, Number(days));
  }
}
