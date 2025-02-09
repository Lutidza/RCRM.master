// 📌 Путь: src/plugins/TelegramAPI/utils/BlockUtils/LayoutBlock/LayoutBlock.ts
// 📌 Версия: 1.2.7
//
// [CHANGELOG]
// - Исправлен импорт renderCatalogBlock.
// - Добавлено логирование перед вызовом renderCatalogBlock.

import type { Payload } from 'payload';
import type { BotContext } from '@/plugins/TelegramAPI/utils/BotUtils/initializeBots';
import { processMessageBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/MessageBlock/index';
import { handleButtonBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/ButtonBlock/ButtonBlock';
import { renderCatalogBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCatalogBlock'; // Обновленный импорт
import { clearPreviousMessages, storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

interface LayoutBlock {
  clearPreviousMessages: boolean;
  name: string;
  blocks: Array<{
    blockType: string;
    description?: string;
    [key: string]: any;
  }>;
}

const blockHandlers: Record<string, (ctx: BotContext, block: any, payload: Payload) => Promise<void>> = {
  messageblock: processMessageBlock,
  'message-blocks': processMessageBlock,
  buttonblock: async (ctx, block, payload) => {
    const description = block.description || 'Выберите действие:';
    await handleButtonBlock(ctx, block, description);
  },
  'button-blocks': async (ctx, block, payload) => {
    const description = block.description || 'Выберите действие:';
    await handleButtonBlock(ctx, block, description);
  },
  catalogblock: renderCatalogBlock,
  'catalog-blocks': renderCatalogBlock,
};

export async function sendLayoutBlock(ctx: BotContext, layoutBlock: LayoutBlock, payload: Payload): Promise<void> {
  try {
    if (layoutBlock.clearPreviousMessages && ctx.chat) {
      log('debug', `Перед отправкой LayoutBlock "${layoutBlock.name}" очищаем предыдущие сообщения.`);
      await clearPreviousMessages(ctx);
    }

    if (!Array.isArray(layoutBlock.blocks) || layoutBlock.blocks.length === 0) {
      const msg = await ctx.reply(`Layout "${layoutBlock.name}" пуст. Добавьте блоки.`);
      storeMessageId(ctx, msg.message_id);
      return;
    }

    for (const block of layoutBlock.blocks) {
      try {
        const blockType = block.blockType?.toLowerCase();
        const handler = blockHandlers[blockType];

        if (handler) {
          log('debug', `Обрабатываем блок типа "${blockType}"`);
          await handler(ctx, block, payload);
        } else {
          log('error', `Неизвестный тип блока: ${blockType}`, payload);
          const msg = await ctx.reply(`Неизвестный тип блока: ${block.blockType}`);
          storeMessageId(ctx, msg.message_id);
        }
      } catch (blockError) {
        log('error', `Ошибка обработки блока: ${(blockError as Error).message}`, payload);
        const msg = await ctx.reply(`Произошла ошибка при обработке блока: ${layoutBlock.name}`);
        storeMessageId(ctx, msg.message_id);
      }
    }
  } catch (error: any) {
    log('error', `Общая ошибка при обработке лейаута "${layoutBlock.name}": ${(error as Error).message}`, payload);
    const errorMsg = await ctx.reply(`Произошла ошибка при обработке лейаута: "${layoutBlock.name}"`);
    storeMessageId(ctx, errorMsg.message_id);
  }
}
