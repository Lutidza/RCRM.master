// Path: src/plugins/TelegramAPI/utils/BotUtils/initializeBots.ts
// Version: 1.4.9-add-input-filter
// ----------------------------------------------------------------------------
// Рефакторинг: добавлено middleware для фильтрации входящих сообщений (inputMessageFilter).
// Также реализована логика формирования реестра команд (allowedCommands) на основе
// CommandBlock и жёстко прописанных команд (например, /start).
// + учитывается поле protectContent из UnifiedBotConfig.

import type { Payload } from 'payload';
import { Bot as TelegramBot, session } from 'grammy';

import { bannedClientHook } from '@/plugins/TelegramAPI/utils/ClientUtils/bannedClient';
import { processClient } from '@/plugins/TelegramAPI/utils/ClientUtils/processClient';
import { sendLayoutBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/LayoutBlock/LayoutBlock';
import { processMessageBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/MessageBlock/MessageBlock';
import { renderCatalogBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCatalogBlock';
import { handleCatalogEvent } from '@/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/CatalogEventHandlers';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { BotConfig } from '@/plugins/TelegramAPI/utils/BotUtils/BotConfig';
import { goBackState } from '@/plugins/TelegramAPI/utils/SystemUtils/goBackState';
import { inputMessageFilter } from '@/plugins/TelegramAPI/utils/SystemUtils/inputMessageFilter';

import type {
  BotContext,
  SessionData,
  UnifiedBotConfig,
  UnifiedBotInterface,
} from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';

export type { BotContext };

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

    // [CHANGE] Теперь TS понимает, что protectContent может быть
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
    // allowedCommands пока не задаём, присвоим позже в initBot
  };
}

/** Формируем список допустимых команд */
function buildAllowedCommands(botConfig: BotConfig): string[] {
  const allowed: string[] = [];
  // Добавим «/start» без слэша
  allowed.push('start');

  const blocks = botConfig.interface.blocks || [];
  blocks.forEach((block: any) => {
    if (
      block.blockType === 'CommandBlock' ||
      block.slug === 'command-blocks' ||
      block.interfaceName === 'CommandBlock'
    ) {
      if (typeof block.command === 'string') {
        const cmd = block.command.trim().replace(/^\//, '');
        if (cmd && !allowed.includes(cmd)) {
          allowed.push(cmd);
        }
      }
    }
  });

  return allowed;
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
      if (unifiedBotData.enabled !== 'enabled') {
        log('info', `Бот "${unifiedBotData.name}" отключён, пропускаем.`, payload);
        continue;
      }
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
        initial: (): SessionData => ({
          previousMessages: [],
          stateStack: [],
          previousState: undefined,
          currentState: undefined,
          isBanned: false,
          botConfig: botConfig,
        }),
      })
    );

    bot.use(bannedClientHook(payload));

    // Сформируем массив допустимых команд
    const allowedCmds = buildAllowedCommands(botConfig);
    botConfig.allowedCommands = allowedCmds;

    // Подключаем фильтр входящих сообщений
    bot.use(inputMessageFilter);

    // Если описание бота есть — обновим
    if (botConfig.description) {
      try {
        await bot.api.setMyDescription(botConfig.description);
        log('info', 'Описание бота успешно обновлено.', payload);
      } catch (error: any) {
        log('error', `Ошибка при обновлении описания бота: ${error.message}`, payload);
      }
    }

    // Обработка /start
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
          const layoutAlias =
            client.total_visit === 1
              ? botConfig.interface.defaultFirstVisitLayout
              : botConfig.interface.defaultStartLayout;
          log('info', `Выбран layoutAlias: ${layoutAlias} (client.total_visit=${client.total_visit})`, payload);

          if (layoutAlias) {
            const layoutBlock = botConfig.interface.blocks.find((b: any) => b.alias === layoutAlias);
            if (layoutBlock) {
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
        ctx.session.botConfig = botConfig;
      } catch (error: any) {
        log('error', `Ошибка обработки команды /start: ${error.message}`, payload);
      }
    });

    // Обработка callback_query
    bot.on('callback_query:data', async (ctx) => {
      if (!ctx.callbackQuery || !ctx.callbackQuery.data) return;
      try {
        const data = ctx.callbackQuery.data;
        const parts = data.split('|');
        const cbType = parts[0]?.trim() ?? '';
        const callbackAlias = parts[1]?.trim() ?? '';

        if (cbType === 'layout' && callbackAlias === 'go_back_state') {
          await goBackState(ctx, payload, botConfig);
        } else if (cbType === 'catalogCategory' || cbType === 'catalogLoadMore') {
          await handleCatalogEvent(cbType, callbackAlias, '', ctx, payload);
          log('info', `Callback "${cbType}|${callbackAlias}" обработан через handleCatalogEvent.`, payload);
        } else {
          switch (cbType) {
            case 'layout': {
              const layoutBlock = botConfig.interface.blocks.find(
                (block: any) => block.alias === callbackAlias
              );
              if (layoutBlock) {
                ctx.session.previousState = layoutBlock;
                await sendLayoutBlock(ctx, botConfig, payload, callbackAlias);
              } else {
                await ctx.reply(`Ошибка: Лейаут с alias "${callbackAlias}" не найден.`);
              }
              break;
            }
            case 'message': {
              await processMessageBlock(ctx, { text: callbackAlias });
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

    // Запуск бота
    bot.start();
    log('info', `🤖 Бот "${botConfig.name}" успешно запущен.`, payload);

    // Обновим статус бота
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
