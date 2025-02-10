// Path: src/plugins/TelegramAPI/utils/BlockUtils/LayoutBlock/LayoutBlock.ts
// Version: 1.3.5
// [CHANGELOG]
// - Добавлена переменная layoutAlias до блока try для обеспечения её доступности в блоке catch.
// - Добавлен параметр aliasOverride для использования alias из callback_data при необходимости.
// - Дополнительное логирование для отладки.

import type { Payload } from 'payload';
import type { BotContext } from '@/plugins/TelegramAPI/utils/BotUtils/initializeBots';
import { BotConfig } from '@/plugins/TelegramAPI/utils/BotUtils/BotConfig'; // Импорт BotConfig
import { processMessageBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/MessageBlock/index';
import { handleButtonBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/ButtonBlock/ButtonBlock';
import { renderCatalogBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCatalogBlock';
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

/**
 * Функция sendLayoutBlock отправляет лейаут, полученный из объекта BotConfig.
 * @param ctx - Контекст бота (BotContext)
 * @param botConfig - Объект BotConfig, объединяющий данные из базы и виртуальные поля для Telegram API
 * @param payload - Объект Payload для работы с базой и логирования
 * @param aliasOverride - (необязательный) Если передан, используется вместо botConfig.currentLayoutAlias для поиска лейаута
 */
export async function sendLayoutBlock(
  ctx: BotContext,
  botConfig: BotConfig,
  payload: Payload,
  aliasOverride?: string
): Promise<void> {
  // Объявляем layoutAlias до try-блока, чтобы он был доступен и в catch
  const layoutAlias = aliasOverride || botConfig.currentLayoutAlias;

  try {
    log('debug', `Используемый layoutAlias: ${layoutAlias}`);
    log('debug', `BotConfig.interface: ${JSON.stringify(botConfig.interface)}`);

    // Ищем layout-блок с нужным alias
    const layoutBlock: LayoutBlock | undefined = botConfig.interface?.blocks?.find(
      (block: any) => block.alias === layoutAlias
    );

    if (!layoutBlock) {
      const msg = await ctx.reply(`Layout "${layoutAlias}" не найден. Добавьте блоки.`);
      storeMessageId(ctx, msg.message_id);
      return;
    }

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
    log('error', `Общая ошибка при обработке лейаута "${layoutAlias}": ${(error as Error).message}`, payload);
    const errorMsg = await ctx.reply(`Произошла ошибка при обработке лейаута: "${layoutAlias}"`);
    storeMessageId(ctx, errorMsg.message_id);
  }
}
