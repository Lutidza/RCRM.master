// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/handlerCatalogBlock.ts
// Version: 1.5.0-productDetails
// [CHANGELOG]
// - Добавлена ветка "productDetails" => renderProductDetails(...)
// - Добавлена ветка "order" => пока заглушка (выводим "Заказ оформлен" или "TODO").
// - Старая логика catalogCategory, catalogLoadMore, catalogBackPage сохранена.

import type { Payload } from 'payload';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { clearPreviousMessages } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { renderCategoryLayout } from './renderCategoryLayout';
import { renderCategoryNav } from './renderCategoryNav';
import { renderProductDetails } from './renderProductDetails';

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
        const rawCategoryId = parts[1]?.trim() ?? '';
        const rawItemsPerPage = parts[2]?.trim() ?? '3';
        const categoryId = parseInt(rawCategoryId, 10);
        const itemsPerPage = parseInt(rawItemsPerPage, 10) || 3;

        if (isNaN(categoryId)) {
          await ctx.reply('Ошибка: некорректный идентификатор категории.');
          break;
        }

        await clearPreviousMessages(ctx);
        ctx.session.categoryLayoutMessages = [];
        ctx.session.categoryPageMessages = [];

        await renderCategoryLayout(ctx, payload, categoryId, 1, itemsPerPage);
        log('info', `Callback "catalogCategory|${categoryId}" -> первая страница категории.`);
        break;
      }

      case 'catalogLoadMore':
      case 'catalogBackPage': {
        const rawCategoryId = parts[1]?.trim() ?? '';
        const rawPageValue = parts[2]?.trim() ?? '1';
        const rawItemsPerPage = parts[3]?.trim() ?? '3';

        const categoryId = parseInt(rawCategoryId, 10);
        const pageValue = parseInt(rawPageValue, 10);
        const itemsPerPage = parseInt(rawItemsPerPage, 10) || 3;

        if (isNaN(categoryId) || isNaN(pageValue)) {
          break;
        }

        const direction = (eventType === 'catalogLoadMore') ? 'next' : 'back';
        await renderCategoryNav(ctx, payload, String(categoryId), pageValue, itemsPerPage, direction);
        log('info', `Callback "${eventType}|${rawCategoryId}" -> страница ${pageValue}. direction=${direction}`);
        break;
      }

      case 'productDetails': {
        // "productDetails|<productId>"
        const rawProductId = parts[1]?.trim() ?? '';
        if (!rawProductId) {
          await ctx.reply('Ошибка: некорректный ID товара.');
          break;
        }
        await renderProductDetails(ctx, rawProductId, payload);
        log('info', `Callback "productDetails|${rawProductId}" -> детальная карточка товара.`);
        break;
      }

      case 'order': {
        // "order|<productId>"
        const rawProductId = parts[1]?.trim() ?? '';
        await ctx.reply(`Заказ оформлен (заглушка). Товар ID=${rawProductId}`);
        log('info', `Callback "order|${rawProductId}" -> заказ (заглушка).`);
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
