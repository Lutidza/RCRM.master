// 📌 Путь: src/plugins/TelegramAPI/index.ts
// 📌 Версия: 5.6.0
//
// [CHANGELOG]
// - Добавлено логирование успешной обработки всех событий.
// - Устранены ошибки при обработке callback_query с типом `catalog`.
// - Добавлена обработка ошибок для всех случаев использования LayoutBlock.
// - Уточнена проверка существования токена перед запуском бота.

import type { Payload, Config, Plugin } from 'payload';
import { Bot as TelegramBot, Context, session, SessionFlavor } from 'grammy';

import Bots from '@/collections/TelegramAPI/Bots';
import Clients from '@/collections/TelegramAPI/Clients';
import { initializeBots } from '@/plugins/TelegramAPI/utils/BotUtils/initializeBots';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { sendLayoutBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/LayoutBlock/LayoutBlock';
import { processMessageBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/MessageBlock/index';
import { renderCatalogBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCatalogBlock';
import { bannedClientHook } from '@/plugins/TelegramAPI/utils/ClientUtils/bannedClient';

interface SessionData {
  previousMessages: number[];
}

type BotContext = Context & SessionFlavor<SessionData>;

const TelegramAPIPlugin: Plugin = (incomingConfig: Config): Config => {
  return {
    ...incomingConfig,
    collections: [
      ...(incomingConfig.collections || []),
      Bots,
      Clients,
    ],
    onInit: async (payload: Payload) => {
      log('info', 'TelegramAPIPlugin initialization started.', payload);
      await initializeBots(payload);

      log('info', 'TelegramAPIPlugin initialized successfully.', payload);
    },
  };
};

/**
 * Инициализация бота с обработчиками событий.
 */
async function initBotWithHandlers(payload: Payload, botData: any): Promise<void> {
  try {
    // Ранняя проверка токена
    if (!botData.token) {
      log('error', `Ошибка: у бота "${botData.name}" отсутствует токен.`, payload);
      return;
    }

    const bot = new TelegramBot<BotContext>(botData.token);

    bot.use(
      session<SessionData, BotContext>({
        initial: () => ({ previousMessages: [] }),
      }),
    );

    bot.use(bannedClientHook(payload)); // Проверка заблокированных клиентов

    // Обработка команды /start
    bot.command('start', async (ctx) => {
      try {
        const telegramId = ctx.from?.id;
        if (!telegramId) {
          await ctx.reply('Ошибка: Telegram ID отсутствует.');
          throw new Error('Telegram ID отсутствует.');
        }

        const layoutAlias = botData.interface?.defaultStartLayout || 'start';
        const layoutBlock = botData.interface?.blocks?.find(
          (block: any) => block.alias === layoutAlias,
        );

        if (!layoutBlock) {
          await ctx.reply(`Ошибка: Layout "${layoutAlias}" не найден.`);
          return;
        }

        await sendLayoutBlock(ctx, layoutBlock, payload);
        log('info', `/start успешно обработан для пользователя ${telegramId}`, payload);
      } catch (error: any) {
        log('error', `Ошибка обработки команды /start: ${error.message}`, payload);
      }
    });

    // Обработка callback_query
    bot.on('callback_query:data', async (ctx) => {
      try {
        const data = ctx.callbackQuery?.data;
        if (!data) {
          await ctx.reply('Ошибка: данные callback отсутствуют.');
          throw new Error('Данные callback отсутствуют.');
        }

        const [cbType, cbAlias] = data.split('|');

        switch (cbType) {
          case 'layout': {
            const layoutBlock = botData.interface?.blocks?.find(
              (block: any) => block.alias === cbAlias,
            );
            if (!layoutBlock) {
              await ctx.reply(`Лейаут с alias "${cbAlias}" не найден.`);
              return;
            }
            await sendLayoutBlock(ctx, layoutBlock, payload);
            log('info', `Layout "${cbAlias}" успешно обработан.`, payload);
            break;
          }
          case 'message': {
            await processMessageBlock(ctx, { message: cbAlias });
            log('info', `MessageBlock "${cbAlias}" успешно обработан.`, payload);
            break;
          }
          case 'catalog': {
            await renderCatalogBlock(ctx, { alias: cbAlias }, payload);
            log('info', `CatalogBlock "${cbAlias}" успешно обработан.`, payload);
            break;
          }
          default:
            await ctx.reply(`Неизвестный тип callback: ${cbType}`);
            log('debug', `Неизвестный тип callback: ${cbType}`, payload);
        }

        await ctx.answerCallbackQuery();
      } catch (error: any) {
        log('error', `Ошибка обработки callback_query: ${error.message}`, payload);
      }
    });

    bot.start();
    log('info', `🤖 Бот "${botData.name}" успешно запущен.`, payload);

    // Обновление статуса бота
    await payload.update({
      collection: 'bots',
      id: botData.id,
      data: {
        initialization_status: 'Initialized',
        last_initialized: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    log('error', `Ошибка при инициализации бота "${botData.name}": ${error.message}`, payload);
    await payload.update({
      collection: 'bots',
      id: botData.id,
      data: { initialization_status: 'Error' },
    });
  }
}

export default TelegramAPIPlugin;
