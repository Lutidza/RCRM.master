// Path: src/plugins/TelegramAPI/utils/BotUtils/initializeBots.ts
// Version: 1.4.1
//
// [CHANGELOG]
// - Использование BotConfig для настройки ботов.
// - Обработка команды /start: вызывается processClient, флаг isBanned сохраняется в сессию.
// - Middleware bannedClientHook подключён для проверки статуса клиента.
// - Для нового клиента (total_visit === 1) выбирается layout с alias "start_first_visit" через BotConfig.
import type { Payload } from 'payload';
import { Bot as TelegramBot } from 'grammy';
import { session, Context, SessionFlavor } from 'grammy';
import { handleCatalogEvent } from '@/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/CatalogEventHandlers';
import { sendLayoutBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/LayoutBlock/LayoutBlock';
import { bannedClientHook } from '@/plugins/TelegramAPI/utils/ClientUtils/bannedClient';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { processMessageBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/MessageBlock/index';
import { renderCatalogBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCatalogBlock';
import { BotConfig } from '@/plugins/TelegramAPI/utils/BotUtils/BotConfig';
import { processClient } from '@/plugins/TelegramAPI/utils/ClientUtils/processClient';

export interface SessionData {
  previousMessages: number[];
  isBanned?: boolean;
}

export type BotContext = Context & SessionFlavor<SessionData>;

export interface UnifiedBotInterface {
  blocks?: any[];
  defaultStartLayout: string;
  defaultFirstVisitLayout: string;
  total_visit?: number;
}

export interface UnifiedBotConfig {
  id: number;
  name: string;
  token: string;
  description?: string;
  enabled: string;
  initialization_status: string;
  last_initialized?: string;
  interface?: UnifiedBotInterface;
}

export function createUnifiedBotConfig(rawBotData: any): UnifiedBotConfig {
  return {
    id: rawBotData.id,
    name: rawBotData.name,
    token: rawBotData.token,
    description: rawBotData.description,
    enabled: rawBotData.enabled,
    initialization_status: rawBotData.initialization_status,
    last_initialized: rawBotData.last_initialized,
    interface: rawBotData.interface
      ? {
        blocks: Array.isArray(rawBotData.interface.blocks) ? rawBotData.interface.blocks : [],
        defaultStartLayout: rawBotData.interface.defaultStartLayout,
        defaultFirstVisitLayout: rawBotData.interface.defaultFirstVisitLayout,
        total_visit: typeof rawBotData.interface.total_visit === 'number' ? rawBotData.interface.total_visit : 0,
      }
      : undefined,
  };
}

export async function initializeBots(payload: Payload): Promise<void> {
  try {
    log('info', 'Поиск активных ботов...', payload);
    const { docs: bots } = await payload.find({
      collection: 'bots',
      where: { enabled: { equals: 'enabled' } },
      limit: 999,
    });
    log('info', `Найдено ${bots.length} ботов для инициализации.`, payload);

    for (const botData of bots) {
      const unifiedBotData = createUnifiedBotConfig(botData);
      const botConfig = new BotConfig(unifiedBotData);

      console.log('BotConfig:', JSON.stringify(botConfig, null, 2));
      await initBot(payload, botConfig);
    }
  } catch (error: any) {
    log('error', `Ошибка при инициализации ботов: ${error.message}`, payload);
  }
}

async function initBot(payload: Payload, botConfig: BotConfig): Promise<void> {
  try {
    if (!botConfig.token) {
      log('error', `Пропущен бот "${botConfig.name}": отсутствует токен.`, payload);
      return;
    }
    const bot = new TelegramBot<BotContext>(botConfig.token);

    bot.use(
      session<SessionData, BotContext>({
        initial: () => ({ previousMessages: [] }),
      })
    );

    // Подключаем middleware для проверки забаненности клиента (из bannedClient.ts)
    bot.use(bannedClientHook(payload));

    // Обработка команды /start
    bot.command('start', async (ctx) => {
      try {
        log('info', `Получена команда /start от пользователя ${ctx.from?.id}.`, payload);
        const telegramId = ctx.from?.id;
        if (!telegramId) {
          await ctx.reply('Ошибка: Telegram ID не найден.');
          return;
        }
        const configInstance = botConfig instanceof BotConfig ? botConfig : new BotConfig(botConfig);
        const YOUR_BOT_ID = botConfig.id;
        const client = await processClient(payload, telegramId, YOUR_BOT_ID, {
          first_name: ctx.from?.first_name,
          last_name: ctx.from?.last_name,
          username: ctx.from?.username,
        });
        ctx.session.isBanned = client.isBanned;
        const layoutAlias = configInstance.currentLayoutAlias;
        log('info', `Выбран layoutAlias: ${layoutAlias}`, payload);
        await sendLayoutBlock(ctx, configInstance, payload);
      } catch (error: any) {
        log('error', `Ошибка обработки команды /start: ${error.message}`, payload);
      }
    });

    // Обработка callback‑запросов
    bot.on('callback_query:data', async (ctx) => {
      try {
        const data = ctx.callbackQuery?.data;
        if (!data) {
          await ctx.reply('Ошибка: данные callback отсутствуют.');
          return;
        }
        const [cbType, callbackAlias] = data.split('|');
        if (!cbType || !callbackAlias) {
          await ctx.reply('Некорректный формат callback.');
          return;
        }
        switch (cbType) {
          case 'layout': {
            await sendLayoutBlock(ctx, botConfig, payload, callbackAlias);
            log('info', `Layout "${callbackAlias}" успешно обработан.`, payload);
            break;
          }
          case 'message': {
            await processMessageBlock(ctx, { message: callbackAlias });
            log('info', `MessageBlock "${callbackAlias}" успешно обработан.`, payload);
            break;
          }
          case 'catalog': {
            await renderCatalogBlock(ctx, { alias: callbackAlias }, payload);
            log('info', `CatalogBlock "${callbackAlias}" успешно обработан.`, payload);
            break;
          }
          default: {
            await handleCatalogEvent(cbType, callbackAlias, '', ctx, payload);
            log('info', `Callback "${cbType}|${callbackAlias}" обработан через handleCatalogEvent.`, payload);
          }
        }
        await ctx.answerCallbackQuery();
      } catch (error: any) {
        log('error', `Ошибка обработки callback_query: ${error.message}`, payload);
      }
    });

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
