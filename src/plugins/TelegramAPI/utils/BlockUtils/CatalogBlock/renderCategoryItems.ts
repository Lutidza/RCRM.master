// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCategoryItems.ts
// Version: 1.4.15
// [CHANGELOG]
// - Никакого clearMessages, так как при catalogCategory всё удаляется глобально через clearPreviousMessages(ctx).
// - При рендере добавляем все новые сообщения в previousMessages.

import type { Payload } from 'payload';
import type { BotContext, RenderOptions } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { InlineKeyboard } from 'grammy';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { paginateCategoryItems } from './paginateCategoryItems';
import { renderProductCard } from './renderProductCard';

export async function renderCategoryItems(
  ctx: BotContext,
  categoryId: string,
  options: RenderOptions,
  payload: Payload
): Promise<void> {
  try {
    if (!ctx.chat) {
      log('error', 'Контекст чата отсутствует.', payload);
      return;
    }

    const category = await payload.findByID({
      collection: 'product-categories',
      id: categoryId,
    });
    if (!category) {
      log('error', `Категория с ID "${categoryId}" не найдена.`, payload);
      const msg = await ctx.reply('Ошибка: категория не найдена.');
      storeMessageId(ctx, msg.message_id);
      return;
    }

    const categoryMedia = Array.isArray(category.media) && category.media.length > 0
      ? category.media
      : [{ url: 'https://kvartiry-tbilisi.ru/images/demo/catalog_banner-1.png' }];
    const categoryCaption = `<b>${category.name}</b>\n${category.description || ''}`;
    const categoryMsg = await ctx.replyWithPhoto(categoryMedia[0].url, {
      caption: categoryCaption,
      parse_mode: 'HTML',
    });
    storeMessageId(ctx, categoryMsg.message_id);

    let subcategories: any[] = [];
    let products: any[] = [];
    const subResult = await payload.find({
      collection: 'product-categories',
      where: { parent_id: { equals: categoryId } },
      limit: 999,
    });
    subcategories = subResult.docs;

    let totalPages = 0;
    const productPagination = await paginateCategoryItems(
      payload,
      'products',
      { category_ids: { in: [parseInt(categoryId, 10)] } },
      options.page,
      options.itemsPerPage
    );
    products = productPagination.docs;
    totalPages = productPagination.totalPages;

    if (subcategories.length === 0 && products.length === 0) {
      const emptyMessage = await ctx.reply('Категория пуста. Нет данных для отображения.');
      storeMessageId(ctx, emptyMessage.message_id);
      return;
    }

    if (subcategories.length > 0) {
      const subKeyboard = new InlineKeyboard();
      subcategories.forEach((subcat: any, index: number) => {
        subKeyboard.text(subcat.name, `catalogCategory|${subcat.id}|${options.itemsPerPage}`);
        if ((index + 1) % 2 === 0) subKeyboard.row();
      });
      const subMsg = await ctx.reply('Подкатегории:', { reply_markup: subKeyboard });
      storeMessageId(ctx, subMsg.message_id);
    }

    if (products.length > 0) {
      for (const product of products) {
        await renderProductCard(ctx, product.id, payload);
      }

      if (options.page <= totalPages) {
        const navKeyboard = new InlineKeyboard();
        if (options.page < totalPages) {
          navKeyboard.text("Next", `catalogLoadMore|${categoryId}|${options.page + 1}|${options.itemsPerPage}`);
        }
        // Или можно добавить кнопку Back, если page > 1
        const navMsg = await ctx.reply(`Страница: ${options.page} из ${totalPages}`, {
          parse_mode: 'HTML',
          reply_markup: navKeyboard,
        });
        storeMessageId(ctx, navMsg.message_id);
      }
    }

    log('info', `Элементы категории (ID: ${categoryId}) успешно отправлены.`, payload);
  } catch (error: any) {
    log('error', `Ошибка при рендеринге категории: ${error.message}`, payload);
    const errorMsg = await ctx.reply('Произошла ошибка при загрузке данных категории.');
    storeMessageId(ctx, errorMsg.message_id);
  }
}
