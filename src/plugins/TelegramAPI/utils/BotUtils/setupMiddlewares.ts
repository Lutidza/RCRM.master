// Path: src/plugins/TelegramAPI/utils/BotUtils/setupMiddlewares.ts
// Version: 1.1.0
// [CHANGELOG]
// - Добавлен "монки-патч" для ctx.reply и ctx.replyWithPhoto, чтобы автоматически
//   ставить protect_content = ctx.session.botConfig?.protectContent ?? false.
// - Удаляем ручное protect_content из всех других файлов.

import { session } from 'grammy';
import type { BotContext, SessionData } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { bannedClientHook } from '@/plugins/TelegramAPI/utils/ClientUtils/bannedClient';
import { inputMessageFilter } from '@/plugins/TelegramAPI/utils/SystemUtils/inputMessageFilter';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import type { Bot as TelegramBot } from 'grammy';
import type { Payload } from 'payload';

export function setupMiddlewares(bot: TelegramBot<BotContext>, botConfig: any, payload: Payload): void {
  // 1) Session
  bot.use(
    session<SessionData, BotContext>({
      initial: () => ({
        previousMessages: [],
        stateStack: [],
        previousState: undefined,
        currentState: undefined,
        isBanned: false,
        botConfig: botConfig,
        startMessageId: undefined,
      }),
    })
  );

  // 2) Блокируем, если клиент забанен
  bot.use(bannedClientHook(payload));

  // 3) Фильтруем входящие сообщения (SQL-инъекции, slash-команды и т.д.)
  bot.use(inputMessageFilter);

  // 4) "Монки-патч" для автоматического protect_content
  bot.use(async (ctx, next) => {
    // Сохраняем оригинальные методы
    const originalReply = ctx.reply.bind(ctx);
    const originalReplyWithPhoto = ctx.replyWithPhoto.bind(ctx);

    // Переопределяем ctx.reply
    ctx.reply = async function (text, options = {}) {
      if (typeof options.protect_content === 'undefined') {
        options.protect_content = ctx.session.botConfig?.protectContent ?? false;
      }
      return originalReply(text, options);
    };

    // Переопределяем ctx.replyWithPhoto
    ctx.replyWithPhoto = async function (photo, options = {}) {
      if (typeof options.protect_content === 'undefined') {
        options.protect_content = ctx.session.botConfig?.protectContent ?? false;
      }
      return originalReplyWithPhoto(photo, options);
    };

    // Если нужно, аналогично переопределяем ctx.replyWithDocument, ctx.replyWithAudio и т.д.

    await next();
  });

  log('info', 'Middlewares успешно зарегистрированы.', payload);
}
