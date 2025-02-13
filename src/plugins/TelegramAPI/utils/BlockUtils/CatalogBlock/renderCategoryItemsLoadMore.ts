// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCategoryItemsLoadMore.ts
// Version: 1.0.40-refactored
//
// [CHANGELOG]
// - Используется обновленная функция paginateCategoryItems, которая возвращает totalPages.
// - Если текущая страница равна totalPages, кнопка "Загрузить ещё" не выводится.
// - Добавлена опция protect_content во всех вызовах ctx.reply/ctx.replyWithPhoto.

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import { storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { paginateCategoryItems } from './paginateCategoryItems';
import { renderProductCard } from './renderProductCard';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';

const DEMO_PRODUCT_IMAGE_URL = "https://kvartiry-tbilisi.ru/images/demo/product_banner.png";

export async function renderCategoryItemsLoadMore(
  ctx: BotContext,
  categoryId: string,
  payload: Payload,
  page: number,
  itemsPerPage: number = 3
): Promise<void> {
  try {
    log('info', `Подгружаем товары для категории ${categoryId}, страница ${page}, itemsPerPage=${itemsPerPage}`, payload);
    const productPagination = await paginateCategoryItems(
      payload,
      'products',
      { category_ids: { in: [categoryId] } },
      page,
      itemsPerPage
    );
    const products = productPagination.docs;
    const totalPages = productPagination.totalPages;
    if (!products || products.length === 0) {
      const noMoreMsg = await ctx.reply("Нет больше товаров.", {
        parse_mode: 'HTML',
        protect_content: ctx.session.botConfig?.protectContent || false,
      });
      storeMessageId(ctx, noMoreMsg.message_id);
      log('info', `Товары закончились для категории ${categoryId}`, payload);
      return;
    }
    for (const product of products) {
      await renderProductCard(ctx, product.id, payload);
    }
    if (page < totalPages) {
      const navKeyboard = new InlineKeyboard().text(
        "Загрузить ещё",
        `catalogLoadMore|${categoryId}|${page + 1}|${itemsPerPage}`
      );
      const navMsg = await ctx.reply(`Страница ${page}`, {
        parse_mode: 'HTML',
        reply_markup: navKeyboard,
        protect_content: ctx.session.botConfig?.protectContent || false,
      });
      storeMessageId(ctx, navMsg.message_id);
    }
  } catch (error: any) {
    log('error', `Ошибка в renderCategoryItemsLoadMore: ${error.message}`, payload);
    await ctx.reply("Произошла ошибка при подгрузке товаров.", {
      protect_content: ctx.session.botConfig?.protectContent || false,
    });
  }
}
