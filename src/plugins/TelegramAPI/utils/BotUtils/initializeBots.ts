// Path: src/plugins/TelegramAPI/utils/BotUtils/initializeBots.ts
// Version: 1.4.4-refactored
// Рефакторинг: Обновлены импорты типов (BotContext, SessionData) из общего файла TelegramBlocksTypes.ts,
// добавлено явное указание типа для начального состояния сессии с двумя типовыми аргументами,
// а также оставлены отдельные вызовы bot.use для регистрации различных middleware.

import type { Payload } from 'payload';
import { Bot as TelegramBot, session } from 'grammy';

import { bannedClientHook } from '@/plugins/TelegramAPI/utils/ClientUtils/bannedClient';
import { processClient } from '@/plugins/TelegramAPI/utils/ClientUtils/processClient';
import { sendLayoutBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/LayoutBlock/LayoutBlock';
import { processMessageBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/MessageBlock/index';
import { renderCatalogBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCatalogBlock';
import { handleCatalogEvent } from '@/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/CatalogEventHandlers';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { BotConfig } from '@/plugins/TelegramAPI/utils/BotUtils/BotConfig';
import { goBackState } from '@/plugins/TelegramAPI/utils/SystemUtils/goBackState';
// Импорт типов из общего файла
import type { BotContext, SessionData } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';

export type { BotContext };

export interface UnifiedBotInterface {
  blocks: any[];
  defaultStartLayout: string;
  defaultFirstVisitLayout: string;
  total_visit: number;
}

export interface UnifiedBotConfig {
  id: number;
  name: string;
  token: string;
  description?: string;
  enabled: string;
  initialization_status: string;
  last_initialized?: string;
  interface?: Partial<UnifiedBotInterface>;
}

/**
 * Объединяет данные из объекта бота (из коллекции Bots)
 * в единый объект настроек (UnifiedBotConfig). Если rawBotData.interface присутствует,
 * его поля объединяются с набором дефолтных значений; если отсутствует – подставляются дефолтные значения.
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
    initialization_status: rawBotData.initialization_status,
    last_initialized: rawBotData.last_initialized,
    interface: {
      blocks: Array.isArray(rawBotData.interface?.blocks) ? rawBotData.interface.blocks : defaultInterface.blocks,
      defaultStartLayout: rawBotData.interface?.defaultStartLayout ?? defaultInterface.defaultStartLayout,
      defaultFirstVisitLayout: rawBotData.interface?.defaultFirstVisitLayout ?? defaultInterface.defaultFirstVisitLayout,
      total_visit: typeof rawBotData.interface?.total_visit === 'number'
        ? rawBotData.interface.total_visit
        : defaultInterface.total_visit,
    },
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

    // Регистрация middleware сессии с явным указанием типа начального состояния и двух типовых аргументов.
    bot.use(
      session<SessionData, BotContext>({
        initial: (): SessionData => ({
          previousMessages: [] as number[],
          stateStack: [] as any[],
          previousState: undefined,
          isBanned: false,
        }),
      })
    );

    // Регистрация middleware для проверки статуса клиента (бан).
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
        const client = await processClient(payload, telegramId, botConfig.id, {
          first_name: ctx.from?.first_name,
          last_name: ctx.from?.last_name,
          username: ctx.from?.username,
        });
        ctx.session.isBanned = client.isBanned;
        if (!client.isBanned) {
          const layoutAlias = client.total_visit === 1
            ? botConfig.interface.defaultFirstVisitLayout
            : botConfig.interface.defaultStartLayout;
          log('info', `Выбран layoutAlias: ${layoutAlias} (client.total_visit=${client.total_visit})`, payload);
          if (layoutAlias) {
            const layoutBlock = botConfig.interface.blocks.find((block: any) => block.alias === layoutAlias);
            if (layoutBlock) {
              // Сохраняем текущее состояние для возможности возврата
              ctx.session.previousState = layoutBlock;
              await sendLayoutBlock(ctx, botConfig, payload, layoutAlias);
            } else {
              await ctx.reply(`Ошибка: Лейаут с alias "${layoutAlias}" не найден.`);
            }
          } else {
            await ctx.reply('Ошибка: Не удалось определить layout alias.');
          }
        } else {
          await ctx.reply('Ваш аккаунт заблокирован.');
        }
      } catch (error: any) {
        log('error', `Ошибка обработки команды /start: ${error.message}`, payload);
      }
    });

    // Обработка callback‑запросов
    bot.on('callback_query:data', async (ctx) => {
      if (!ctx.callbackQuery || !ctx.callbackQuery.data) return;
      try {
        const data = ctx.callbackQuery.data;
        const parts = data.split('|');
        const cbType = parts[0]?.trim() ?? '';
        const callbackAlias = parts[1]?.trim() ?? '';

        // Если callback типа "layout" и alias равен "go_back_state", перенаправляем в goBackState
        if (cbType === 'layout' && callbackAlias === 'go_back_state') {
          await goBackState(ctx, payload, botConfig);
        }
        // Обработка типов, связанных с каталогом
        else if (cbType === 'catalogCategory' || cbType === 'catalogLoadMore') {
          await handleCatalogEvent(cbType, callbackAlias, '', ctx, payload);
          log('info', `Callback "${cbType}|${callbackAlias}" обработан через handleCatalogEvent.`, payload);
        }
        else {
          switch (cbType) {
            case 'layout': {
              const layoutBlock = botConfig.interface.blocks.find((block: any) => block.alias === callbackAlias);
              if (layoutBlock) {
                ctx.session.previousState = layoutBlock;
                await sendLayoutBlock(ctx, botConfig, payload, callbackAlias);
              } else {
                await ctx.reply(`Ошибка: Лейаут с alias "${callbackAlias}" не найден.`);
              }
              break;
            }
            case 'message': {
              await processMessageBlock(ctx, { message: callbackAlias });
              log('info', `MessageBlock "${callbackAlias}" успешно обработан.`, payload);
              break;
            }
            case 'command': {
              if (callbackAlias === 'go_back_state') {
                await goBackState(ctx, payload, botConfig);
              } else {
                await ctx.reply(`Неизвестная команда: ${callbackAlias}`);
              }
              break;
            }
            default: {
              await ctx.reply(`Неизвестный тип callback: ${cbType}`);
            }
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
