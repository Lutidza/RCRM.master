// Path: src/plugins/TelegramAPI/utils/BotUtils/registerBots.ts
// Version: 1.0.0-refactored
// Подробные комментарии в коде:
// - Этот файл отвечает за регистрацию (запуск) всех ботов из коллекции Payload.
// - Функция registerBots ищет активных ботов в CMS, создает для каждого объект BotConfig и вызывает initBot.
// - Файл переименован в registerBots для уменьшения путаницы с термином "initialize".

import type { Payload } from 'payload';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { BotConfig } from '@/plugins/TelegramAPI/utils/BotUtils/BotConfig';
import { initBot } from '@/plugins/TelegramAPI/utils/BotUtils/initBot';

import type {
  UnifiedBotConfig,
  UnifiedBotInterface,
} from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';

/**
 * Функция для создания объекта UnifiedBotConfig на основе данных из CMS.
 */
export function createUnifiedBotConfig(rawBotData: any): UnifiedBotConfig {
  const defaultInterface: UnifiedBotInterface = {
    blocks: [],
    defaultStartLayout: 'start',
    defaultFirstVisitLayout: 'start_first_visit',
    total_visit: 0,
  };

  return {
    id: rawBotData.id,
    name: rawBotData.name,
    token: rawBotData.token,
    description: rawBotData.description,
    enabled: rawBotData.enabled,
    protectContent: rawBotData.protectContent,
    initialization_status: rawBotData.initialization_status,
    last_initialized: rawBotData.last_initialized,
    interface: {
      blocks: Array.isArray(rawBotData.interface?.blocks)
        ? rawBotData.interface.blocks
        : defaultInterface.blocks,
      defaultStartLayout:
        rawBotData.interface?.defaultStartLayout ?? defaultInterface.defaultStartLayout,
      defaultFirstVisitLayout:
        rawBotData.interface?.defaultFirstVisitLayout ?? defaultInterface.defaultFirstVisitLayout,
      total_visit:
        typeof rawBotData.interface?.total_visit === 'number'
          ? rawBotData.interface.total_visit
          : defaultInterface.total_visit,
    },
    allowedCommands: [],
  };
}

/**
 * Функция регистрации (запуска) всех активных ботов.
 * Ищет активных ботов в CMS и вызывает initBot для каждого.
 */
export async function registerBots(payload: Payload): Promise<void> {
  try {
    log('info', 'Поиск активных ботов...', payload);
    const { docs: bots } = await payload.find({
      collection: 'bots',
      where: { enabled: { equals: 'enabled' } },
      limit: 999,
    });
    log('info', `Найдено ${bots.length} ботов для регистрации.`, payload);
    for (const botData of bots) {
      const unifiedBotData = createUnifiedBotConfig(botData);
      if (unifiedBotData.enabled !== 'enabled') {
        log('info', `Бот "${unifiedBotData.name}" отключён, пропускаем.`, payload);
        continue;
      }
      const botConfig = new BotConfig(unifiedBotData);
      console.log('BotConfig:', JSON.stringify(botConfig, null, 2));
      await initBot(payload, botConfig);
    }
  } catch (error: any) {
    log('error', `Ошибка при регистрации ботов: ${error.message}`, payload);
  }
}
