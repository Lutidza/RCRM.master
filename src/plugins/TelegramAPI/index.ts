// Путь: src/plugins/TelegramAPI/index.ts
// Версия: 5.2.1
//
// Этот плагин подключает коллекции Bots и Clients, инициализирует ботов через grammY,
// регистрирует команды, обрабатывает команду /start, обновляет или создаёт клиента,
// выбирает лейаут по alias, обновляет описание бота в Telegram (если задано), и осуществляет подробное логирование.

import type { Payload, Config, Plugin } from 'payload';
import {
  Bot as TelegramBot,
  Context,
  session,
  SessionFlavor,
  InlineKeyboard,
} from 'grammy';

import Bots from '@/collections/TelegramAPI/Bots';
import Clients from '@/collections/TelegramAPI/Clients';

interface SessionData {
  previousMessages: number[];
}

type BotContext = Context & SessionFlavor<SessionData>;

function log(level: 'info' | 'error' | 'debug', message: string, payload?: Payload) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  if (payload?.logger && typeof payload.logger[level] === 'function') {
    payload.logger[level](message);
  }
}

const TelegramAPIPlugin: Plugin = (incomingConfig: Config): Config => {
  return {
    ...incomingConfig,
    collections: [
      ...(incomingConfig.collections || []),
      Bots,
      Clients,
    ],
    onInit: async (payload: Payload) => {
      log('info', 'Инициализация TelegramAPIPlugin началась.', payload);
      await initializeBots(payload);
    },
  };
};

export default TelegramAPIPlugin;

async function initializeBots(payload: Payload) {
  try {
    log('info', 'Поиск всех включённых ботов...', payload);
    const { docs: bots } = await payload.find({
      collection: 'bots',
      where: { enabled: { equals: true } },
      limit: 999,
    });
    log('info', `Найдено ${bots.length} ботов для инициализации.`, payload);
    for (const botData of bots) {
      await initSingleBot(payload, botData);
    }
  } catch (err: any) {
    log('error', `Ошибка инициализации ботов: ${err.message}`, payload);
  }
}

async function initSingleBot(payload: Payload, botData: any) {
  try {
    log('info', `Инициализация бота "${botData.name}" началась.`, payload);
    if (!botData.token) {
      log('error', `❌ Бот "${botData.name}" пропущен: нет токена.`, payload);
      return;
    }

    const bot = new TelegramBot<BotContext>(botData.token);

    bot.use(session<SessionData, BotContext>({
      initial: () => ({ previousMessages: [] }),
    }));

    // Обработчик callback_query с полной логикой для типа "layout"
    bot.on('callback_query:data', async (ctx) => {
      try {
        await ctx.answerCallbackQuery();
        const data = ctx.callbackQuery.data;
        if (!data) return;
        const [cbType, cbValue] = data.split('|');
        if (!cbValue) {
          await ctx.reply('Не указано значение для callback.');
          return;
        }
        if (cbType === 'layout') {
          // Полная логика: ищем лейаут по alias в интерфейсе текущего бота
          const layoutBlock = findLayoutBlock(botData.interface?.blocks || [], cbValue);
          if (layoutBlock) {
            await sendLayoutBlock(ctx, layoutBlock);
          } else {
            await ctx.reply(`Лейаут с alias "${cbValue}" не найден.`);
          }
        } else if (cbType === 'message') {
          await ctx.reply(cbValue);
        } else if (cbType === 'command') {
          // Здесь можно вызвать соответствующий обработчик команды
          await ctx.reply(`Команда "${cbValue}" выполнена.`);
        } else if (cbType === 'link') {
          // Для ссылки обработка происходит на стороне кнопки (InlineKeyboard.url)
          // Но если что-то требуется, можно добавить дополнительную логику
        } else {
          await ctx.reply('Неизвестный тип кнопки');
        }
        log('info', `Обработан callback: ${cbType}|${cbValue}`, undefined);
      } catch (error: any) {
        log('error', `Ошибка обработки callback_query: ${error.message}`, undefined);
      }
    });

    const commands = collectCommandBlocks(botData.interface?.blocks || []);
    if (commands.length > 0) {
      await bot.api.setMyCommands(
        commands.map((c: any) => ({
          command: c.command.replace('/', ''),
          description: c.responseText?.slice(0, 50) || 'No description',
        })),
      );
      log('info', `Зарегистрировано ${commands.length} команд для бота "${botData.name}".`, payload);
    }

    bot.command('start', async (ctx) => {
      log('info', 'Команда /start получена.', payload);
      const telegramId = ctx.from?.id;
      if (!telegramId) {
        log('error', 'Не удалось получить Telegram ID (ctx.from.id отсутствует).', payload);
        return;
      }
      const numericBotId: number = botData.id;
      log('debug', `Поиск клиента с telegram_id=${telegramId} и bot=${numericBotId}`, payload);
      const client = await processClient(payload, telegramId, numericBotId, ctx.from);
      log('debug', `Данные клиента: ${JSON.stringify(client)}`, payload);
      if (client.status === 'banned') {
        await ctx.reply('Ваш аккаунт заблокирован. Обратитесь к администратору.');
        return;
      }
      const firstVisitAlias = botData.interface?.defaultFirstVisitLayout || 'start_first_visit';
      const startAlias = botData.interface?.defaultStartLayout || 'start';
      const layoutAlias = client.total_visit === 1 ? firstVisitAlias : startAlias;
      log('info', `Выбран alias лейаута: ${layoutAlias}`, payload);
      const layoutBlock = findLayoutBlock(botData.interface?.blocks || [], layoutAlias);
      if (!layoutBlock) {
        await ctx.reply(`Требуется настройка интерфейса: лейаут с alias "${layoutAlias}" не найден`);
        return;
      }
      await sendLayoutBlock(ctx, layoutBlock);
    });

    for (const cmd of commands) {
      if (cmd.command !== '/start') {
        bot.command(cmd.command.replace('/', ''), async (ctx) => {
          log('info', `Выполнение команды ${cmd.command}`, payload);
          await ctx.reply(cmd.responseText);
        });
      }
    }

    bot.start();
    log('info', `🤖 Бот "${botData.name}" успешно запущен.`, payload);

    if (botData.description) {
      try {
        await bot.api.setMyDescription(botData.description || '');
        log('info', `Описание бота обновлено: ${botData.description}`, payload);
      } catch (error: any) {
        log('error', `Ошибка обновления описания бота: ${error.message}`, payload);
      }
    }

    await payload.update({
      collection: 'bots',
      id: botData.id,
      data: {
        initialization_status: 'Initialized',
        last_initialized: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    log('error', `Ошибка инициализации бота "${botData.name}": ${error.message}`, payload);
    await payload.update({
      collection: 'bots',
      id: botData.id,
      data: { initialization_status: 'Error' },
    });
  }
}

function collectCommandBlocks(blocks: any[]): any[] {
  const commands: any[] = [];
  for (const block of blocks) {
    if (block.blockType === 'CommandBlock' || block.blockType.toLowerCase() === 'command-blocks') {
      commands.push(block);
    } else if ((block.blockType === 'LayoutBlock' || block.blockType.toLowerCase() === 'layout-blocks') && Array.isArray(block.blocks)) {
      commands.push(...collectCommandBlocks(block.blocks));
    }
  }
  return commands;
}

function findLayoutBlock(blocks: any[], layoutAlias: string): any | null {
  for (const block of blocks) {
    if (block.blockType && block.blockType.toLowerCase() === 'layout-blocks' && block.alias === layoutAlias) {
      return block;
    }
    if (block.blockType && block.blockType.toLowerCase() === 'layout-blocks' && Array.isArray(block.blocks)) {
      const nested = findLayoutBlock(block.blocks, layoutAlias);
      if (nested) return nested;
    }
  }
  return null;
}

async function sendLayoutBlock(ctx: BotContext, layoutBlock: any) {
  if (layoutBlock.clearPreviousMessages) {
    if (ctx.chat) {
      for (const msgId of ctx.session.previousMessages) {
        try {
          await ctx.api.deleteMessage(ctx.chat.id, msgId);
        } catch (err) {
          log('error', `Ошибка при удалении сообщения ${msgId}: ${err}`, undefined);
        }
      }
      ctx.session.previousMessages = [];
    }
  }

  if (!Array.isArray(layoutBlock.blocks) || layoutBlock.blocks.length === 0) {
    const msg = await ctx.reply(`Лейаут "${layoutBlock.name}" пуст. Настройте блоки.`);
    storeMessageId(ctx, msg.message_id);
    return;
  }

  for (const block of layoutBlock.blocks) {
    switch (block.blockType) {
      case 'MessageBlock':
      case 'message-blocks':
        await handleMessageBlock(ctx, block);
        break;
      case 'ButtonBlock':
      case 'button-blocks':
        await handleButtonBlock(ctx, block);
        break;
      case 'LayoutBlock':
      case 'layout-blocks':
        log('debug', 'Вложенный LayoutBlock обнаружен, пропускаем его.', undefined);
        break;
      case 'CommandBlock':
      case 'command-blocks':
        break;
      default: {
        const msg = await ctx.reply(`Неизвестный тип блока: ${block.blockType}`);
        storeMessageId(ctx, msg.message_id);
      }
    }
  }
}

async function handleMessageBlock(ctx: BotContext, blockData: any) {
  if (!ctx.chat) return;
  if (blockData.media?.url) {
    const msg = await ctx.replyWithPhoto(blockData.media.url, {
      caption: blockData.text || '',
    });
    storeMessageId(ctx, msg.message_id);
  } else {
    const msg = await ctx.reply(blockData.text);
    storeMessageId(ctx, msg.message_id);
  }
}

async function handleButtonBlock(ctx: BotContext, blockData: any) {
  if (!ctx.chat) return;
  if (!Array.isArray(blockData.buttons) || blockData.buttons.length === 0) {
    const msg = await ctx.reply('ButtonBlock не содержит кнопок.');
    storeMessageId(ctx, msg.message_id);
    return;
  }

  const inlineKeyboard = new InlineKeyboard();
  for (const btn of blockData.buttons) {
    if (btn.newRow) {
      inlineKeyboard.row();
    }
    if (btn.callbackType === 'layout') {
      inlineKeyboard.text(btn.text, `layout|${btn.callback_data || ''}`);
    } else if (btn.callbackType === 'message') {
      inlineKeyboard.text(btn.text, `message|${btn.callback_data || ''}`);
    } else if (btn.callbackType === 'command') {
      inlineKeyboard.text(btn.text, `command|${btn.callback_data || ''}`);
    } else if (btn.callbackType === 'link') {
      inlineKeyboard.url(btn.text, btn.url || '');
    } else {
      inlineKeyboard.text(btn.text, btn.callback_data || '');
    }
  }

  const msg = await ctx.reply('Выберите вариант:', {
    reply_markup: inlineKeyboard,
  });
  storeMessageId(ctx, msg.message_id);
}

function storeMessageId(ctx: BotContext, messageId: number) {
  ctx.session.previousMessages.push(messageId);
}

async function processClient(
  payload: Payload,
  telegramId: number,
  botId: number,
  fromData: any
) {
  try {
    const { docs } = await payload.find({
      collection: 'clients',
      where: { telegram_id: { equals: telegramId } },
      limit: 1,
    });

    if (docs && docs.length > 0) {
      const existingClient = docs[0]!;
      // Обращаемся к полю связи, используя приведение типа, так как автогенерированные типы могут иметь поле "bot" вместо "bots"
      let botsArray: number[] = [];
      if ((existingClient as any).bots) {
        if (Array.isArray((existingClient as any).bots)) {
          botsArray = (existingClient as any).bots;
        } else {
          botsArray = [(existingClient as any).bots];
        }
      }
      if (!botsArray.includes(botId)) {
        botsArray.push(botId);
        await payload.update({
          collection: 'clients',
          id: existingClient.id,
          data: { bots: botsArray } as any,
        });
      }
      const updated = await payload.update({
        collection: 'clients',
        id: existingClient.id,
        data: {
          first_name: fromData.first_name,
          last_name: fromData.last_name,
          user_name: fromData.username || 'anonymous_user',
          last_visit: new Date().toISOString(),
        },
      });
      log('info', `Клиент обновлён: ${existingClient.id}`, payload);
      return updated;
    } else {
      const created = await payload.create({
        collection: 'clients',
        data: {
          telegram_id: telegramId,
          bots: [botId] as any,
          first_name: fromData.first_name,
          last_name: fromData.last_name,
          user_name: fromData.username || 'anonymous_user',
          total_visit: 1,
          status: 'new',
          last_visit: new Date().toISOString(),
        },
      });
      log('info', `Новый клиент создан: ${created.id}`, payload);
      return created;
    }
  } catch (error: any) {
    log('error', `Ошибка processClient(): ${error.message}`, payload);
    return { status: 'new', total_visit: 1 };
  }
}
