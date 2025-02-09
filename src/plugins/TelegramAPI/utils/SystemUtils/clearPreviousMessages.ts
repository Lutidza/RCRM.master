// 📌 Путь: src/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages.ts
// 📌 Версия: 1.3.4
//
// [CHANGELOG]
// - Добавлено более детальное логирование для проверки наличия и обработки `message_id`.
// - Обеспечено корректное удаление всех сообщений.

import type { Context, SessionFlavor } from 'grammy';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

interface SessionData {
  previousMessages: number[];
}

export type BotContext = Context & SessionFlavor<SessionData>;

/**
 * Удаляет все сообщения и кнопки, ID которых сохранены в сессии.
 * @param ctx - Контекст бота (BotContext)
 */
export async function clearPreviousMessages(ctx: BotContext): Promise<void> {
  if (!ctx.chat || !ctx.session || !Array.isArray(ctx.session.previousMessages)) {
    log('debug', 'Контекст чата или данные сессии недоступны.');
    return;
  }

  const chatId = ctx.chat.id;
  const messageIds = ctx.session.previousMessages;

  log(
    'debug',
    `Начало очистки. Количество сообщений для удаления: ${messageIds.length}. Текущие сообщения: ${JSON.stringify(
      messageIds
    )}`
  );

  try {
    for (const msgId of messageIds) {
      try {
        // Попытка удалить кнопки (reply_markup)
        await ctx.api.editMessageReplyMarkup(chatId, msgId, { reply_markup: undefined });
        log('debug', `Кнопки из сообщения ${msgId} успешно удалены.`);
      } catch (error: any) {
        log(
          'debug',
          `Кнопки из сообщения ${msgId} не найдены или уже удалены: ${error.message}`
        );
      }

      try {
        // Удаление самого сообщения
        await ctx.api.deleteMessage(chatId, msgId);
        log('debug', `Сообщение ${msgId} успешно удалено.`);
      } catch (error: any) {
        log('error', `Ошибка удаления сообщения ${msgId}: ${error.message}`);
      }
    }
  } catch (err: any) {
    log('error', `Ошибка при очистке сообщений: ${err.message}`);
  } finally {
    // Очищаем массив сообщений
    ctx.session.previousMessages = [];
    log('debug', `Очистка завершена. Список сообщений в сессии очищен.`);
  }
}

/**
 * Сохраняет идентификатор отправленного сообщения в сессию.
 * @param ctx - Контекст бота (BotContext)
 * @param messageId - Идентификатор отправленного сообщения
 */
export function storeMessageId(ctx: BotContext, messageId: number): void {
  if (!messageId) {
    log('error', `storeMessageId: Передан некорректный messageId: ${messageId}`);
    return;
  }

  if (ctx.session && Array.isArray(ctx.session.previousMessages)) {
    ctx.session.previousMessages.push(messageId);
    log(
      'debug',
      `storeMessageId: Сообщение ${messageId} добавлено в сессию. Текущие сообщения: ${JSON.stringify(
        ctx.session.previousMessages
      )}`
    );
  } else {
    log('error', `storeMessageId: Не удалось сохранить сообщение ${messageId} в сессию.`);
  }
}
