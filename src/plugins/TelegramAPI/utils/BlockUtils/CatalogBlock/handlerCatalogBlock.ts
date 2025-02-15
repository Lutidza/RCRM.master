// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/handlerCatalogBlock.ts
// Version: 1.4.0-refactored
// [CHANGELOG]
// - Переименован из CatalogEventHandlers.ts
// - Используем switch-case для catalogCategory, catalogLoadMore, catalogBackPage
// - Удалили manual protect_content (rely on monkey-patch)

import type { Payload } from 'payload';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { clearPreviousMessages } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { renderCategoryLayout } from './renderCategoryLayout';
import { renderCategoryNav } from './renderCategoryNav';

/**
 * Основной обработчик callback-событий каталога (catalogCategory, catalogLoadMore, catalogBackPage).
 * @param cbType - например "catalogCategory", "catalogLoadMore", "catalogBackPage".
 * @param _unused - не используется, оставлен для совместимости.
 * @param _unused2 - не используется, оставлен для совместимости.
 * @param ctx - контекст бота.
 * @param payload - экземпляр Payload.
 */
export async function handlerCatalogBlock(
  cbType: string,
  _unused: string,
  _unused2: string | undefined,
  ctx: BotContext,
  payload: Payload,
): Promise<void> {
  try {
    if (!ctx.callbackQuery?.data) {
      throw new Error('Данные callback отсутствуют.');
    }

    const parts = ctx.callbackQuery.data.split('|');
    const eventType = parts[0]?.trim() ?? '';

    switch (eventType) {
      case 'catalogCategory': {
        // "catalogCategory|<categoryId>|<itemsPerPage>"
        const rawCategoryId = parts[1]?.trim() ?? '';
        const rawItemsPerPage = parts[2]?.trim() ?? '3';

        const categoryId = parseInt(rawCategoryId, 10);
        const itemsPerPage = parseInt(rawItemsPerPage, 10) || 3;

        if (isNaN(categoryId)) {
          await ctx.reply('Ошибка: некорректный идентификатор категории.');
          break;
        }

        // Очищаем предыдущие сообщения, обнуляем массивы
        await clearPreviousMessages(ctx);
        ctx.session.categoryLayoutMessages = [];
        ctx.session.categoryPageMessages = [];

        // Рендерим первую страницу категории
        await renderCategoryLayout(ctx, payload, categoryId, 1, itemsPerPage);
        log('info', `Callback "catalogCategory|${categoryId}" -> первая страница категории.`);
        break;
      }

      case 'catalogLoadMore':
      case 'catalogBackPage': {
        // "catalogLoadMore|<catId>|<page>|<itemsPerPage>"
        // "catalogBackPage|<catId>|<page>|<itemsPerPage>"
        const rawCategoryId = parts[1]?.trim() ?? '';
        const rawPageValue = parts[2]?.trim() ?? '1';
        const rawItemsPerPage = parts[3]?.trim() ?? '3';

        const categoryId = parseInt(rawCategoryId, 10);
        const pageValue = parseInt(rawPageValue, 10);
        const itemsPerPage = parseInt(rawItemsPerPage, 10) || 3;

        if (isNaN(categoryId) || isNaN(pageValue)) {
          // Некорректные параметры
          break;
        }

        const direction = (eventType === 'catalogLoadMore') ? 'next' : 'back';
        await renderCategoryNav(ctx, payload, String(categoryId), pageValue, itemsPerPage, direction);
        log('info', `Callback "${eventType}|${rawCategoryId}" -> страница ${pageValue}. direction=${direction}`);
        break;
      }

      default: {
        await ctx.reply(`Неизвестный тип события каталога: ${eventType}`);
        break;
      }
    }

    await ctx.answerCallbackQuery();
  } catch (error: any) {
    await ctx.reply('Произошла ошибка при обработке события каталога.');
    log('error', `handlerCatalogBlock: ${error.message}`, payload);
  }
}
