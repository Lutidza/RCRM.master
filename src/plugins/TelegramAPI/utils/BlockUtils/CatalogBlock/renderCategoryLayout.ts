// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCategoryLayout.ts
// Version: 1.1.0-no-manual-protect
// [CHANGELOG]
// - Убрано ручное protect_content, rely on monkey-patch in setupMiddlewares.

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import { storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { paginateCategoryItems } from './paginateCategoryItems';
import { renderProductCard } from './renderProductCard';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';

export async function renderCategoryLayout(
  ctx: BotContext,
  payload: Payload,
  categoryId: number,
  page: number,
  itemsPerPage: number,
): Promise<void> {
  try {
    if (!ctx.chat) return;

    if (!ctx.session.categoryLayoutMessages) ctx.session.categoryLayoutMessages = [];
    if (!ctx.session.categoryPageMessages) ctx.session.categoryPageMessages = [];

    const category = await payload.findByID({
      collection: 'product-categories',
      id: categoryId,
    });
    if (!category) {
      const msg = await ctx.reply("Категория не найдена.");
      storeMessageId(ctx, msg.message_id);
      return;
    }

    const bannerUrl = Array.isArray(category.media) && category.media.length > 0
      ? category.media[0].url
      : 'https://kvartiry-tbilisi.ru/images/demo/catalog_banner-1.png';

    const catMsg = await ctx.replyWithPhoto(bannerUrl, {
      caption: `<b>${category.name}</b>\n${category.description || ''}`,
      parse_mode: 'HTML',
    });
    storeMessageId(ctx, catMsg.message_id);
    ctx.session.categoryLayoutMessages.push(catMsg.message_id);

    const subcatsResult = await payload.find({
      collection: 'product-categories',
      where: { parent_id: { equals: categoryId } },
      limit: 999,
    });
    const subcats = subcatsResult.docs;
    if (subcats.length > 0) {
      const subKeyboard = new InlineKeyboard();
      subcats.forEach((sc: any, idx: number) => {
        subKeyboard.text(sc.name, `catalogCategory|${sc.id}|${itemsPerPage}`);
        if ((idx + 1) % 2 === 0) subKeyboard.row();
      });
      const subMsg = await ctx.reply('Подкатегории:', {
        reply_markup: subKeyboard,
      });
      storeMessageId(ctx, subMsg.message_id);
      ctx.session.categoryLayoutMessages.push(subMsg.message_id);
    }

    const pagination = await paginateCategoryItems(
      payload,
      'products',
      { category_ids: { in: [categoryId] } },
      page,
      itemsPerPage
    );
    const products = pagination.docs;
    const totalPages = pagination.totalPages;

    if (!products || products.length === 0) {
      const noDataMsg = await ctx.reply("Нет товаров в категории.");
      storeMessageId(ctx, noDataMsg.message_id);
      ctx.session.categoryPageMessages.push(noDataMsg.message_id);
      return;
    }

    for (const product of products) {
      const productMsgId = await renderProductCard(ctx, product.id, payload);
      if (productMsgId) {
        ctx.session.categoryPageMessages.push(productMsgId);
      }
    }

    const navKeyboard = new InlineKeyboard();
    // Пример: Back -> "layout|store_home_page"
    navKeyboard.text("Back", "layout|store_home_page");

    if (page < totalPages) {
      navKeyboard.text("Next", `catalogLoadMore|${categoryId}|${page + 1}|${itemsPerPage}`);
    }

    const navMsg = await ctx.reply(`Страница: ${page} из ${totalPages}`, {
      parse_mode: 'HTML',
      reply_markup: navKeyboard,
    });
    storeMessageId(ctx, navMsg.message_id);
    ctx.session.categoryPageMessages.push(navMsg.message_id);

    log('info', `renderCategoryLayout: page=${page}, categoryId=${categoryId}`, payload);
  } catch (err) {
    log('error', `Ошибка renderCategoryLayout: ${err}`, payload);
  }
}
