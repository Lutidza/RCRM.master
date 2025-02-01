// Path: src/plugins/TelegramAPI/index.ts
// Version: 5.2.4
//
// This plugin connects the Bots and Clients collections, initializes bots using grammY,
// registers commands, processes the /start command, updates or creates a client (using the processClient utility),
// selects a layout by alias, updates the bot description in Telegram (if provided), and performs detailed logging.
// The status-checking logic has been updated to work with dynamic statuses (a relationship field).
// If a client's status (populated as an object or as an ID) has an alias equal to "banned", the client is blocked.

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
import { processClient } from '@/plugins/TelegramAPI/utils/ClientUtils/processClient';

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
      log('info', 'TelegramAPIPlugin initialization started.', payload);
      await initializeBots(payload);
    },
  };
};

export default TelegramAPIPlugin;

async function initializeBots(payload: Payload) {
  try {
    log('info', 'Searching for all enabled bots...', payload);
    const { docs: bots } = await payload.find({
      collection: 'bots',
      where: { enabled: { equals: true } },
      limit: 999,
    });
    log('info', `Found ${bots.length} bots for initialization.`, payload);
    for (const botData of bots) {
      await initSingleBot(payload, botData);
    }
  } catch (err: any) {
    log('error', `Error initializing bots: ${err.message}`, payload);
  }
}

async function initSingleBot(payload: Payload, botData: any) {
  try {
    log('info', `Initializing bot "${botData.name}"...`, payload);
    if (!botData.token) {
      log('error', `❌ Bot "${botData.name}" skipped: no token provided.`, payload);
      return;
    }

    const bot = new TelegramBot<BotContext>(botData.token);

    bot.use(session<SessionData, BotContext>({
      initial: () => ({ previousMessages: [] }),
    }));

    bot.on('callback_query:data', async (ctx) => {
      try {
        await ctx.answerCallbackQuery();
        const data = ctx.callbackQuery.data;
        if (!data) return;
        const [cbType, cbValue] = data.split('|');
        if (!cbValue) {
          await ctx.reply('Callback value is missing.');
          return;
        }
        if (cbType === 'layout') {
          const layoutBlock = findLayoutBlock(botData.interface?.blocks || [], cbValue);
          if (layoutBlock) {
            await sendLayoutBlock(ctx, layoutBlock);
          } else {
            await ctx.reply(`Layout with alias "${cbValue}" not found.`);
          }
        } else if (cbType === 'message') {
          await ctx.reply(cbValue);
        } else if (cbType === 'command') {
          await ctx.reply(`Command "${cbValue}" executed.`);
        } else if (cbType === 'link') {
          await ctx.answerCallbackQuery();
        } else {
          await ctx.reply('Unknown button type');
        }
        log('info', `Processed callback: ${cbType}|${cbValue}`, undefined);
      } catch (error: any) {
        log('error', `Error processing callback_query: ${error.message}`, undefined);
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
      log('info', `Registered ${commands.length} commands for bot "${botData.name}".`, payload);
    }

    bot.command('start', async (ctx) => {
      log('info', 'Command /start received.', payload);
      const telegramId = ctx.from?.id;
      if (!telegramId) {
        log('error', 'Failed to retrieve Telegram ID (ctx.from.id is undefined).', payload);
        return;
      }
      const numericBotId: number = botData.id;
      log('debug', `Searching for client with telegram_id=${telegramId} and bot=${numericBotId}`, payload);
      const client = await processClient(payload, telegramId, numericBotId, ctx.from);
      log('debug', `Client data: ${JSON.stringify(client)}`, payload);

      // Check if the client is banned based on dynamic status (alias "banned")
      let isBanned = false;
      if (client.status) {
        if (typeof client.status === 'object' && client.status !== null) {
          isBanned = client.status.alias === 'banned';
        } else {
          const statusResult = await payload.find({
            collection: 'statuses',
            where: { id: { equals: client.status } },
            limit: 1,
          });
          const statusDoc = statusResult.docs[0];
          isBanned = statusDoc ? statusDoc.alias === 'banned' : false;
        }
      }
      if (isBanned) {
        await ctx.reply('Ваш аккаунт заблокирован. Обратитесь к администратору.');
        return;
      }

      const firstVisitAlias = botData.interface?.defaultFirstVisitLayout || 'start_first_visit';
      const startAlias = botData.interface?.defaultStartLayout || 'start';
      const layoutAlias = client.total_visit === 1 ? firstVisitAlias : startAlias;
      log('info', `Selected layout alias: ${layoutAlias}`, payload);
      const layoutBlock = findLayoutBlock(botData.interface?.blocks || [], layoutAlias);
      if (!layoutBlock) {
        await ctx.reply(`Interface configuration required: layout with alias "${layoutAlias}" not found`);
        return;
      }
      await sendLayoutBlock(ctx, layoutBlock);
    });

    for (const cmd of commands) {
      if (cmd.command !== '/start') {
        bot.command(cmd.command.replace('/', ''), async (ctx) => {
          log('info', `Executing command ${cmd.command}`, payload);
          await ctx.reply(cmd.responseText);
        });
      }
    }

    bot.start();
    log('info', `🤖 Bot "${botData.name}" started successfully.`, payload);

    if (botData.description) {
      try {
        await bot.api.setMyDescription(botData.description || '');
        log('info', `Bot description updated: ${botData.description}`, payload);
      } catch (error: any) {
        log('error', `Error updating bot description: ${error.message}`, payload);
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
    log('error', `Error initializing bot "${botData.name}": ${error.message}`, payload);
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
          log('error', `Error deleting message ${msgId}: ${err}`, undefined);
        }
      }
      ctx.session.previousMessages = [];
    }
  }

  if (!Array.isArray(layoutBlock.blocks) || layoutBlock.blocks.length === 0) {
    const msg = await ctx.reply(`Layout "${layoutBlock.name}" is empty. Please configure the blocks.`);
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
        log('debug', 'Nested LayoutBlock detected, skipping it.', undefined);
        break;
      case 'CommandBlock':
      case 'command-blocks':
        break;
      default: {
        const msg = await ctx.reply(`Unknown block type: ${block.blockType}`);
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
    const msg = await ctx.reply('ButtonBlock does not contain any buttons.');
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

  const msg = await ctx.reply('Please choose an option:', {
    reply_markup: inlineKeyboard,
  });
  storeMessageId(ctx, msg.message_id);
}

function storeMessageId(ctx: BotContext, messageId: number) {
  ctx.session.previousMessages.push(messageId);
}
