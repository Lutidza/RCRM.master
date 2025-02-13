// Path: src/plugins/TelegramAPI/utils/BlockUtils/LayoutBlock/LayoutBlock.ts
// Version: 1.3.8-refactored
// Рефакторинг: Использование общего типа TelegramLayoutBlock и BotContext из файла TelegramBlocksTypes.ts.
// Локальное объявление типа LayoutBlock удалено. Функционал обработки блоков остаётся без изменений.
// Добавлена логика сохранения текущего состояния в стек (stateStack) перед переключением на новый layout.

import type { Payload } from 'payload';
// Импорт типов из общего файла с типами
import type { BotContext, TelegramLayoutBlock } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { processMessageBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/MessageBlock/index';
import { handleButtonBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/ButtonBlock/ButtonBlock';
import { renderCatalogBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCatalogBlock';
import { clearPreviousMessages, storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

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

export async function sendLayoutBlock(
  ctx: BotContext,
  botConfig: any, // Ожидается объект типа BotConfig
  payload: Payload,
  aliasOverride?: string
): Promise<void> {
  // Если aliasOverride не задан, используем значение из botConfig.interface.defaultStartLayout
  const layoutAlias = aliasOverride ?? botConfig.interface?.defaultStartLayout;

  if (!layoutAlias) {
    await ctx.reply('Ошибка: Не удалось определить layout alias.');
    return;
  }

  try {
    log('debug', `Используемый layoutAlias: ${layoutAlias}`);
    log('debug', `BotConfig.interface: ${JSON.stringify(botConfig.interface)}`);

    // Если уже установлено текущее состояние и его alias отличается от нового, сохраняем его в стек
    if (ctx.session.currentState && ctx.session.currentState.alias !== layoutAlias) {
      ctx.session.stateStack.push(ctx.session.currentState);
    }

    // Если интерфейс отсутствует или блоков нет – выводим сообщение и завершаем
    if (!botConfig.interface || !botConfig.interface.blocks || botConfig.interface.blocks.length === 0) {
      await ctx.reply(`Layout "${layoutAlias}" не содержит блоков. Добавьте блоки.`);
      return;
    }

    // Используем общее определение типа TelegramLayoutBlock вместо локального LayoutBlock
    const layoutBlock: TelegramLayoutBlock | undefined = botConfig.interface!.blocks.find(
      (block: any) => block.alias === layoutAlias
    );

    if (!layoutBlock) {
      const msg = await ctx.reply(`Layout "${layoutAlias}" не найден. Добавьте блоки.`);
      storeMessageId(ctx, msg.message_id);
      return;
    }

    // Обновляем текущее состояние
    ctx.session.currentState = layoutBlock;

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
