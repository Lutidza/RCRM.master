// Path: src/plugins/TelegramAPI/utils/BotUtils/initBot.ts
// Version: 1.0.0-refactored
// Подробные комментарии в коде:
// - Этот файл содержит функцию initBot, которая инициализирует (запускает) одного бота.
// - Функция регистрирует middlewares, команды и callback-обработчики, устанавливает описание и запускает бота.
// - Экспортируется функция initBot для использования в файле регистрации ботов.

import type { Payload } from 'payload';
import { Bot as TelegramBot } from 'grammy';
import { setupMiddlewares } from '@/plugins/TelegramAPI/utils/BotUtils/setupMiddlewares';
import { setupCommands, buildAllowedCommands } from '@/plugins/TelegramAPI/utils/BotUtils/setupCommands';
import { setupCallbacks } from '@/plugins/TelegramAPI/utils/BotUtils/setupCallbacks';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { BotConfig } from '@/plugins/TelegramAPI/utils/BotUtils/BotConfig';

import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';

/**
 * Функция инициализации (запуска) одного бота.
 * Регистрирует middlewares, команды, callback-обработчики, устанавливает описание и запускает бота.
 */
export async function initBot(payload: Payload, botConfig: BotConfig): Promise<void> {
  try {
    if (!botConfig.token) {
      log('error', `Пропущен бот "${botConfig.name}": отсутствует токен.`, payload);
      return;
    }
    const bot = new TelegramBot<BotContext>(botConfig.token);
    // Регистрируем middlewares
    setupMiddlewares(bot, botConfig, payload);

    // Формируем список допустимых команд
    botConfig.allowedCommands = buildAllowedCommands(botConfig);
    // Регистрируем команды и callback-обработчики
    setupCommands(bot, botConfig, payload);
    setupCallbacks(bot, botConfig, payload);

    if (botConfig.description) {
      try {
        await bot.api.setMyDescription(botConfig.description);
        log('info', 'Описание бота успешно обновлено.', payload);
      } catch (error: any) {
        log('error', `Ошибка при обновлении описания бота: ${error.message}`, payload);
      }
    }
    bot.start();
    log('info', `🤖 Бот "${botConfig.name}" успешно запущен.`, payload);
    await payload.update({
      collection: 'bots',
      id: botConfig.id,
      data: {
        initialization_status: 'Initialized',
        last_initialized: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    log('error', `Ошибка при инициализации бота "${botConfig.name}": ${error.message}`, payload);
    await payload.update({
      collection: 'bots',
      id: botConfig.id,
      data: { initialization_status: 'Error' },
    });
  }
}
