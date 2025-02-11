// Path: src/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages.ts
// Version: 1.3.5
//
// [CHANGELOG]
// - Переименовано поле currentCategoryId в activeCategoryId для лучшей читаемости.
// - Логика очистки сообщений остаётся прежней.
import type { Context, SessionFlavor } from 'grammy';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

interface SessionData {
  previousMessages: number[];
  activeCategoryId?: string;
}

export type BotContext = Context & SessionFlavor<SessionData>;

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
