import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { parseId } from '../common/utils/id.util';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('conversations')
  @ApiQuery({ name: 'userId', required: false })
  conversations(@Query('userId') userId?: string) {
    return this.chat.conversations(userId ? parseId(userId) : undefined);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create conversation' })
  createConversation(@Body() dto: CreateConversationDto) {
    return this.chat.createConversation(dto);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({
    summary: 'Send chat message and generate assistant response',
  })
  send(@Param('id') id: string, @Body() dto: SendMessageDto) {
    return this.chat.send(parseId(id), dto);
  }

  @Delete('conversations/:id')
  removeConversation(@Param('id') id: string) {
    return this.chat.removeConversation(parseId(id));
  }
}
