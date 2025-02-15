// Path: src/plugins/TelegramAPI/utils/BotUtils/setupMiddlewares.ts
// Version: 1.0.0
// Подробные комментарии:
// - Файл для регистрации middlewares для Telegram бота
// - Регистрирует session, bannedClientHook и inputMessageFilter
// - Используется в инициализации каждого бота

import { session } from 'grammy';
import type { BotContext, SessionData } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { bannedClientHook } from '@/plugins/TelegramAPI/utils/ClientUtils/bannedClient';
import { inputMessageFilter } from '@/plugins/TelegramAPI/utils/SystemUtils/inputMessageFilter';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import type { Bot as TelegramBot } from 'grammy'; // для типизации

export function setupMiddlewares(bot: TelegramBot<BotContext>, botConfig: any, payload: any): void {
  // Регистрируем session middleware с инициализацией SessionData
  bot.use(
    session<SessionData, BotContext>({
      initial: (): SessionData => ({
        previousMessages: [],
        stateStack: [],
        previousState: undefined,
        currentState: undefined,
        isBanned: false,
        botConfig: botConfig,
        // Поле для хранения ID последнего сообщения /start
        startMessageId: undefined,
      }),
    })
  );
  // Регистрируем middleware для проверки бана
  bot.use(bannedClientHook(payload));
  // Регистрируем фильтр входящих сообщений
  bot.use(inputMessageFilter);

  log('info', 'Middlewares успешно зарегистрированы.', payload);
}
