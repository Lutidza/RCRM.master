// Path: src/plugins/TelegramAPI/utils/SystemUtils/inputMessageFilter.ts
// Version: 1.0.8
// [CHANGELOG]
// - Не трогаем protect_content, так как теперь оно добавляется в setupMiddlewares.ts "монки-патч".
// - Сохраняем проверку SQL-инъекций, slash-команд, и пропуск callback_query.

import { MiddlewareFn } from 'grammy';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';

// Паттерны для защиты
const sqlInjectionPattern = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|EXEC|UNION|--|WHERE|HAVING|GROUP\s+BY|ORDER\s+BY|EXECUTE|INTO|LIKE|REPLACE|TRUNCATE|SHOW|DESCRIBE)\b)/i;
const dangerousCharsPattern = /[`$;"'\\]/g;
const scriptTagPattern = /<script\b[^>]*>(.*?)<\/script>/gi;
const evalPattern = /\beval\s*\(.*\)/gi;

const maxCommandLength = 100;

export const inputMessageFilter: MiddlewareFn<BotContext> = async (ctx, next) => {
  // Пропускаем callback_query без проверки slash-команд
  if (ctx.callbackQuery) {
    return next();
  }

  const text = ctx.message?.text;
  if (typeof text === 'string') {
    // Проверка на опасные паттерны
    if (
      text.length > 1000 ||
      sqlInjectionPattern.test(text) ||
      dangerousCharsPattern.test(text) ||
      scriptTagPattern.test(text) ||
      evalPattern.test(text)
    ) {
      await blockMessage(ctx, 'Сообщение содержит потенциально опасные конструкции. Удаляем...');
      return;
    }

    // Проверка slash-команды
    if (text.startsWith('/')) {
      const trimmed = text.trim();
      if (trimmed.length > maxCommandLength) {
        await blockMessage(ctx, 'Команда слишком длинная и будет отклонена.');
        return;
      }
      const cmdWithoutSlash = trimmed.slice(1).split(' ')[0] || '';
      const allowedCommands = ctx.session.botConfig?.allowedCommands || [];

      if (!allowedCommands.includes(cmdWithoutSlash)) {
        await blockMessage(ctx, 'Неизвестная команда. Сообщение удалено.');
        return;
      }
      // Допустимая команда
      return next();
    }

    // Не callback, не slash-команда => удаляем
    await blockMessage(ctx, 'Обычные сообщения не поддерживаются, используйте кнопки.');
    return;
  }

  // Если вообще нет текста (например, фото без подписи) => удаляем
  if (ctx.message) {
    await blockMessage(ctx, 'Только текстовые сообщения / или inline-кнопки.');
  }
};

async function blockMessage(ctx: BotContext, notifyText: string) {
  try {
    const replyMsg = await ctx.reply(notifyText);
    if (ctx.chat && ctx.msg) {
      await ctx.api.deleteMessage(ctx.chat.id, ctx.msg.message_id);
    }
  } catch (err) {
    // игнорируем
  }
}
