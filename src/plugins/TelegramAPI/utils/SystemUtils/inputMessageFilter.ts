// Path: src/plugins/TelegramAPI/utils/SystemUtils/inputMessageFilter.ts
// Version: 1.0.3-input-filter-improved
// --------------------------------------------------------------------
// Это middleware для фильтрации входящих сообщений Telegram.
// 1. Проверяет, является ли сообщение командой ("/command") или callback-query.
// 2. Применяет ряд регулярных выражений для отлова SQL-инъекций, опасных символов,
//    HTML/JS-инъекций и т.д.
// 3. Сверяет сообщение (команду) с реестром "допустимых" команд, сформированным при
//    инициализации бота (ctx.session.botConfig.allowedCommands).
// 4. Если сообщение не проходит проверки — удаляет его и отправляет пользователю
//    служебное уведомление.
// 5. Служебное уведомление бота также сохраняется в сессию (storeMessageId), чтобы
//    при очистке previousMessages оно удалялось, как прочие сообщения.
// --------------------------------------------------------------------

import { MiddlewareFn } from 'grammy';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';

// Импортируем функцию storeMessageId, чтобы сохранять ID служебных сообщений
import { storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';

// Паттерны для базовой защиты
const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|UNION|--|WHERE|HAVING|GROUP\s+BY|ORDER\s+BY|EXECUTE|INTO|LIKE|REPLACE|TRUNCATE|SHOW|DESCRIBE)\b)/i;
const dangerousCharsPattern = /[`$;"'\\]/g;
const scriptTagPattern = /<script\b[^>]*>(.*?)<\/script>/gi;
const evalPattern = /\beval\s*\(.*\)/gi;

const maxCommandLength = 100;

// Основное middleware
export const inputMessageFilter: MiddlewareFn<BotContext> = async (ctx, next) => {
  // 1. Пропускаем callback_query (нажатие кнопок)
  if (ctx.callbackQuery) {
    return next();
  }

  // 2. Проверяем, является ли входящее сообщение командой (начинается с "/")
  const text = ctx.message?.text;
  if (text && text.startsWith('/')) {
    const trimmed = text.trim();

    // (a) Проверка длины
    if (trimmed.length > maxCommandLength) {
      await blockMessage(ctx, 'Команда слишком длинная и будет отклонена.');
      return;
    }

    // (b) Проверка по опасным паттернам
    if (
      sqlInjectionPattern.test(trimmed) ||
      dangerousCharsPattern.test(trimmed) ||
      scriptTagPattern.test(trimmed) ||
      evalPattern.test(trimmed)
    ) {
      await blockMessage(ctx, 'Сообщение содержит потенциально опасные конструкции и будет удалено.');
      return;
    }

    // (c) Проверка в списке допустимых команд
    const cmdWithoutSlash = trimmed.slice(1);
    const allowedCommands = ctx.session.botConfig?.allowedCommands || [];

    if (!allowedCommands.includes(cmdWithoutSlash)) {
      await blockMessage(ctx, 'Неизвестная команда. Сообщение удалено.');
      return;
    }

    // Если всё ок — пропускаем дальше
    return next();
  }

  // 3. Если это не команда и не callback, считаем, что сообщения игнорируются
  //    и подлежат удалению.
  if (ctx.message) {
    await blockMessage(ctx, 'Обычные сообщения игнорируются. Используйте команды / или кнопки.');
  }

  return;
};

/**
 * Удаление сообщения пользователя + отправка служебного уведомления.
 * Уведомление также сохраняется в сессию (через storeMessageId), чтобы потом
 * удалять его при очистке предыдущих сообщений.
 */
async function blockMessage(ctx: BotContext, notifyText: string) {
  try {
    // 1) Отправляем уведомление пользователю
    const replyMsg = await ctx.reply(notifyText, {
      // Запрещаем пересылку и копирование, если включён protectContent
      protect_content: ctx.session.botConfig?.protectContent ?? false,
    });
    // Сохраняем ID этого служебного уведомления в session.previousMessages
    storeMessageId(ctx, replyMsg.message_id);

    // 2) Удаляем исходное сообщение (пользователя)
    if (!ctx.chat || !ctx.msg) {
      console.error('Невозможно удалить сообщение: ctx.chat или ctx.msg отсутствуют.');
      return;
    }
    await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
  } catch (err) {
    console.error('Ошибка при удалении сообщения или уведомлении пользователя:', err);
  }
}
