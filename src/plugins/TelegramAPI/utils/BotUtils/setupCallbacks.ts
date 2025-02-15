// Path: src/plugins/TelegramAPI/utils/BotUtils/setupCallbacks.ts
// Version: 1.0.3-refactored
// [CHANGELOG]
// - Ранее вызывали handleCatalogEvent(...) из CatalogEventHandlers.ts
//   теперь вызываем handlerCatalogBlock(...) из handlerCatalogBlock.ts
// - Остальная логика (layout|..., message|..., command|...) не меняется.

import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { sendLayoutBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/LayoutBlock/LayoutBlock';
import { processMessageBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/MessageBlock/MessageBlock';
// [EDIT START] Импортируем новую функцию handlerCatalogBlock
import { handlerCatalogBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/handlerCatalogBlock';
import { goBackState } from '@/plugins/TelegramAPI/utils/SystemUtils/goBackState';
import type { Bot as TelegramBot } from 'grammy';
import type { Payload } from 'payload';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import type { BotConfig } from '@/plugins/TelegramAPI/utils/BotUtils/BotConfig';

export function setupCallbacks(
    bot: TelegramBot<BotContext>,
    botConfig: BotConfig,
    payload: Payload
): void {
  bot.on('callback_query:data', async (ctx) => {
    if (!ctx.callbackQuery || !ctx.callbackQuery.data) return;
    try {
      const data = ctx.callbackQuery.data;
      const parts = data.split('|');
      const cbType = parts[0]?.trim() ?? '';
      const callbackAlias = parts[1]?.trim() ?? '';

      // Если колбэк начинается с "catalog", передаём в handlerCatalogBlock
      if (cbType.startsWith('catalog')) {
        // [EDIT] вызываем новую функцию handlerCatalogBlock
        await handlerCatalogBlock(cbType, callbackAlias, '', ctx, payload);
        log('info', `Callback "${cbType}|${callbackAlias}" обработан через handlerCatalogBlock.`, payload);
      }
      else if (cbType === 'layout' && callbackAlias === 'go_back_state') {
        await goBackState(ctx, payload, botConfig);
      }
      else if (cbType === 'layout' && callbackAlias === 'store_home_page') {
        await sendLayoutBlock(ctx, botConfig, payload, 'store_home_page');
      }
      else {
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
}
