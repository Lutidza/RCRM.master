// Path: src/plugins/TelegramAPI/utils/BotUtils/setupCallbacks.ts
// Version: 1.0.4-productDetails
// [CHANGELOG]
// - Если cbType.startsWith('catalog') => handlerCatalogBlock(...).
// - Если cbType === 'productDetails' или 'order' => тоже handlerCatalogBlock(...).

import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { sendLayoutBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/LayoutBlock/LayoutBlock';
import { processMessageBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/MessageBlock/MessageBlock';
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
    if (!ctx.callbackQuery?.data) return;
    try {
      const data = ctx.callbackQuery.data;
      const parts = data.split('|');
      const cbType = parts[0]?.trim() ?? '';

      // Если колбэк "catalog..." или "productDetails" / "order", передаём в handlerCatalogBlock
      if (cbType.startsWith('catalog') || cbType === 'productDetails' || cbType === 'order') {
        await handlerCatalogBlock(cbType, parts[1] ?? '', parts[2], ctx, payload);
        log('info', `Callback "${cbType}" обработан через handlerCatalogBlock.`, payload);
      }
      else if (cbType === 'layout' && parts[1] === 'go_back_state') {
        await goBackState(ctx, payload, botConfig);
      }
      else if (cbType === 'layout' && parts[1] === 'store_home_page') {
        await sendLayoutBlock(ctx, botConfig, payload, 'store_home_page');
      }
      else {
        switch (cbType) {
          case 'layout': {
            const callbackAlias = parts[1] ?? '';
            const layoutBlock = botConfig.interface.blocks.find(
                (block: any) => block.alias === callbackAlias
            );
            if (layoutBlock) {
              ctx.session.previousState = layoutBlock;
              await sendLayoutBlock(ctx, botConfig, payload, callbackAlias);
            } else {
              await ctx.reply(`Ошибка: Лейаут "${callbackAlias}" не найден.`);
            }
            break;
          }
          case 'message': {
            const callbackAlias = parts[1] ?? '';
            await processMessageBlock(ctx, { text: callbackAlias });
            log('info', `MessageBlock "${callbackAlias}" успешно обработан.`, payload);
            break;
          }
          case 'command': {
            const callbackAlias = parts[1] ?? '';
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
