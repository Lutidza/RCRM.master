// 📌 Путь: src/plugins/TelegramAPI/utils/BotUtils/initializeBots.ts
// 📌 Версия: 1.2.0
//
// [CHANGELOG]
// - Интегрирован bannedClientHook для проверки статуса клиента.
// - Добавлена обработка исключений для функций sendLayoutBlock и handleCatalogEvent.
// - Актуализированы комментарии и логирование.

import type { Payload } from 'payload';
import { Bot as TelegramBot } from 'grammy';
import { session, Context, SessionFlavor } from 'grammy';
import { handleCatalogEvent } from '@/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/CatalogEventHandlers';
import { sendLayoutBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/LayoutBlock/LayoutBlock'; // Обработчик лейаутов
import { bannedClientHook } from '@/plugins/TelegramAPI/utils/ClientUtils/bannedClient'; // Хук проверки статуса клиента
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

export interface SessionData {
  previousMessages: number[];
}

export type BotContext = Context & SessionFlavor<SessionData>;

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
      await initBot(payload, botData);
    }
  } catch (error: any) {
    log('error', `Ошибка при инициализации ботов: ${error.message}`, payload);
  }
}

async function initBot(payload: Payload, botData: any): Promise<void> {
  try {
    if (!botData.token) {
      log('error', `Пропущен бот "${botData.name}": отсутствует токен.`, payload);
      return;
    }

    const bot = new TelegramBot<BotContext>(botData.token);

    bot.use(
      session<SessionData, BotContext>({
        initial: () => ({ previousMessages: [] }),
      }),
    );

    // Хук проверки заблокированных клиентов
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

        const numericBotId: number = botData.id;

        const firstVisitAlias = botData.interface?.defaultFirstVisitLayout || 'start_first_visit';
        const startAlias = botData.interface?.defaultStartLayout || 'start';
        const layoutAlias = botData.interface?.total_visit === 1 ? firstVisitAlias : startAlias;

        log('info', `Выбран layoutAlias: ${layoutAlias}`, payload);

        const layoutBlock = botData.interface?.blocks?.find(
          (block: any) => block.alias === layoutAlias,
        );

        if (!layoutBlock) {
          await ctx.reply(`Ошибка: Layout "${layoutAlias}" не найден.`);
          return;
        }

        await sendLayoutBlock(ctx, layoutBlock, payload);
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
          return;
        }

        const [cbType, callbackAlias] = data.split('|');
        if (!cbType || !callbackAlias) {
          await ctx.reply('Некорректный формат callback.');
          return;
        }

        switch (cbType) {
          case 'layout': {
            const layoutBlock = botData.interface?.blocks?.find(
              (block: any) => block.alias === callbackAlias,
            );
            if (!layoutBlock) {
              await ctx.reply(`Лейаут с alias "${callbackAlias}" не найден.`);
              return;
            }
            await sendLayoutBlock(ctx, layoutBlock, payload);
            break;
          }
          default:
            await handleCatalogEvent(cbType, callbackAlias, '', ctx, payload);
        }

        await ctx.answerCallbackQuery();
        log('info', `Callback обработан: ${cbType}|${callbackAlias}`, payload);
      } catch (error: any) {
        log('error', `Ошибка обработки callback_query: ${error.message}`, payload);
      }
    });

    bot.start();
    log('info', `🤖 Бот "${botData.name}" успешно запущен.`, payload);

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
