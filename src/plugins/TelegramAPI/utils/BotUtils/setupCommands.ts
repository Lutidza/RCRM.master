// Path: src/plugins/TelegramAPI/utils/BotUtils/setupCommands.ts
// Version: 1.0.1-refactored
// Подробные комментарии в коде:
// - Этот файл отвечает за регистрацию команд для Telegram бота.
// - Функция setupCommands регистрирует команду /start (и при необходимости другие команды).
// - Реализована логика удаления предыдущего сообщения /start и сохранения нового ID в сессии.
// - Функция buildAllowedCommands сформирует список допустимых команд и используется при инициализации бота.

import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { processClient } from '@/plugins/TelegramAPI/utils/ClientUtils/processClient';
import { sendLayoutBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/LayoutBlock/LayoutBlock';
import type { Payload } from 'payload';
import type { Bot as TelegramBot } from 'grammy';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import type { BotConfig } from '@/plugins/TelegramAPI/utils/BotUtils/BotConfig';

/**
 * Функция формирования списка допустимых команд из конфигурации бота.
 */
export function buildAllowedCommands(botConfig: BotConfig): string[] {
  const allowed: string[] = [];
  allowed.push('start'); // Добавляем команду /start без слэша.
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

/**
 * Функция регистрации команд для Telegram бота.
 * Регистрируется команда /start с логикой удаления предыдущего сообщения /start
 * и сохранения нового ID в сессии.
 */
export function setupCommands(
  bot: TelegramBot<BotContext>,
  botConfig: BotConfig,
  payload: Payload
): void {
  bot.command('start', async (ctx) => {
    try {
      // [EDIT START] Удаляем предыдущее сообщение /start, если оно существует
      if (ctx.session.startMessageId) {
        try {
          await ctx.api.deleteMessage(ctx.chat.id, ctx.session.startMessageId);
        } catch (delError: any) {
          log('error', `Не удалось удалить предыдущее сообщение /start: ${delError.message}`, payload);
        }
      }
      // Запоминаем ID нового сообщения /start
      if (ctx.msg?.message_id) {
        ctx.session.startMessageId = ctx.msg.message_id;
      }
      // [EDIT END]

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
  // TODO: добавить регистрацию других команд, если потребуется
}
