// Path: src/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages.ts
// Version: 1.3.6-refactored
// Рефакторинг: Импорты типов SessionData и BotContext заменены на общий файл TelegramBlocksTypes.ts.

import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';

export async function clearPreviousMessages(ctx: BotContext): Promise<void> {
  if (!ctx.chat || !ctx.session || !Array.isArray(ctx.session.previousMessages)) {
    log('debug', 'Контекст чата или данные сессии недоступны.');
    return;
  }
  const chatId = ctx.chat.id;
  const messageIds = ctx.session.previousMessages;
  try {
    for (const msgId of messageIds) {
      try {
        await ctx.api.editMessageReplyMarkup(chatId, msgId, { reply_markup: undefined });
      } catch (error: any) {}
      try {
        await ctx.api.deleteMessage(chatId, msgId);
      } catch (error: any) {}
    }
  } catch (err: any) {
    // Обработка ошибки
  } finally {
    ctx.session.previousMessages = [];
  }
}

export function storeMessageId(ctx: BotContext, messageId: number): void {
  if (!messageId) return;
  if (ctx.session && Array.isArray(ctx.session.previousMessages)) {
    ctx.session.previousMessages.push(messageId);
  }
}
