// Path: src/plugins/TelegramAPI/utils/BotUtils/setupCommands.ts
// Version: 1.0.4
// [CHANGELOG]
// - Удалили manual protect_content из ctx.reply(...).
// - При /start удаляем предыдущее сообщение /start, а затем либо открываем лейаут, либо шлём fallback без protect_content (ведь теперь оно добавится через "монки-патч").

import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { processClient } from '@/plugins/TelegramAPI/utils/ClientUtils/processClient';
import { sendLayoutBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/LayoutBlock/LayoutBlock';
import type { Payload } from 'payload';
import type { Bot as TelegramBot } from 'grammy';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import type { BotConfig } from '@/plugins/TelegramAPI/utils/BotUtils/BotConfig';

export function buildAllowedCommands(botConfig: BotConfig): string[] {
  const allowed: string[] = [];
  allowed.push('start');
  // Можно добавить /help и т.д.
  return allowed;
}

export function setupCommands(
    bot: TelegramBot<BotContext>,
    botConfig: BotConfig,
    payload: Payload
): void {
  bot.command('start', async (ctx) => {
    try {
      // Удаляем предыдущее сообщение /start
      if (ctx.session.startMessageId) {
        try {
          await ctx.api.deleteMessage(ctx.chat.id, ctx.session.startMessageId);
        } catch (delError: any) {
          log('error', `Не удалось удалить предыдущее /start: ${delError.message}`, payload);
        }
      }
      // Запоминаем ID нового /start
      if (ctx.msg?.message_id) {
        ctx.session.startMessageId = ctx.msg.message_id;
      }

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
          await sendLayoutBlock(ctx, botConfig, payload, layoutAlias);
        } else {
          await ctx.reply('Ошибка: Не удалось определить layout alias.');
        }
      } else {
        await ctx.reply('Ваш аккаунт заблокирован.');
      }
      ctx.session.botConfig = botConfig;
    } catch (error: any) {
      log('error', `Ошибка обработки /start: ${error.message}`, payload);
      await ctx.reply('Произошла ошибка при обработке /start.');
    }
  });
}
