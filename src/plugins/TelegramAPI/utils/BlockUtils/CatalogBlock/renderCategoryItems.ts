// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCategoryItems.ts
// Version: 1.4.12-refactored
//
// [CHANGELOG]
// - Добавлена опция protect_content во всех вызовах ctx.reply и ctx.replyWithPhoto,
//   чтобы при включенной защите контента сообщения, описания категорий, подкатегории и навигационные сообщения были защищены.
// - Остальная логика рендеринга категорий, подкатегорий и товаров с пагинацией остается прежней.

import type { Payload } from 'payload';
import type { BotContext, RenderOptions } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { clearPreviousMessages, storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { InlineKeyboard } from 'grammy';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { paginateCategoryItems } from './paginateCategoryItems';
import { renderProductCard } from './renderProductCard';

export async function renderCategoryItems(
  ctx: BotContext,
  categoryId: string,
  options: RenderOptions,
  payload: Payload,
  clearMessages: boolean = true
): Promise<void> {
  try {
    if (!ctx.chat) {
      log('error', 'Контекст чата отсутствует.', payload);
      return;
    }
    if (clearMessages) {
      await clearPreviousMessages(ctx);
    }
    const category = await payload.findByID({
      collection: 'product-categories',
      id: categoryId,
    });
    if (!category) {
      log('error', `Категория с ID "${categoryId}" не найдена.`, payload);
      const msg = await ctx.reply('Ошибка: категория не найдена.', {
        protect_content: ctx.session.botConfig?.protectContent || false,
      });
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
      protect_content: ctx.session.botConfig?.protectContent || false,
    });
    storeMessageId(ctx, categoryMsg.message_id);

    let subcategories: any[] = [];
    let products: any[] = [];

    if (options.displayMode === 'subcategories' || options.displayMode === 'all') {
      const subResult = await payload.find({
        collection: 'product-categories',
        where: { parent_id: { equals: categoryId } },
        limit: 999,
      });
      subcategories = subResult.docs;
    }

    let totalPages = 0;
    if (options.displayMode === 'products' || options.displayMode === 'all') {
      const productPagination = await paginateCategoryItems(
        payload,
        'products',
        { category_ids: { in: [parseInt(categoryId, 10)] } },
        options.page,
        options.itemsPerPage
      );
      products = productPagination.docs;
      totalPages = productPagination.totalPages;
    }

    if (subcategories.length === 0 && products.length === 0) {
      const emptyMessage = await ctx.reply('Категория пуста. Нет данных для отображения.', {
        protect_content: ctx.session.botConfig?.protectContent || false,
      });
      storeMessageId(ctx, emptyMessage.message_id);
      return;
    }

    if (subcategories.length > 0 && (options.displayMode === 'subcategories' || options.displayMode === 'all')) {
      const subKeyboard = new InlineKeyboard();
      subcategories.forEach((subcat: any, index: number) => {
        subKeyboard.text(subcat.name, `catalogCategory|${subcat.id}`);
        if ((index + 1) % 2 === 0) subKeyboard.row();
      });
      const subMsg = await ctx.reply('Подкатегории:', {
        reply_markup: subKeyboard,
        protect_content: ctx.session.botConfig?.protectContent || false,
      });
      storeMessageId(ctx, subMsg.message_id);
    }

    if (products.length > 0 && (options.displayMode === 'products' || options.displayMode === 'all')) {
      for (const product of products) {
        await renderProductCard(ctx, product.id, payload);
      }
      if (options.page < totalPages) {
        const navKeyboard = new InlineKeyboard().text(
          "Загрузить ещё",
          `catalogLoadMore|${categoryId}|${options.page + 1}|${options.itemsPerPage}`
        );
        const navMsg = await ctx.reply(`Страница ${options.page}`, {
          parse_mode: 'HTML',
          reply_markup: navKeyboard,
          protect_content: ctx.session.botConfig?.protectContent || false,
        });
        storeMessageId(ctx, navMsg.message_id);
      }
    }
    log('info', `Элементы категории успешно отправлены для ID: ${categoryId}.`, payload);
  } catch (error: any) {
    log('error', `Ошибка при рендеринге элементов категории: ${error.message}`, payload);
    const errorMsg = await ctx.reply('Произошла ошибка при загрузке данных категории.', {
      protect_content: ctx.session.botConfig?.protectContent || false,
    });
    storeMessageId(ctx, errorMsg.message_id);
  }
}
