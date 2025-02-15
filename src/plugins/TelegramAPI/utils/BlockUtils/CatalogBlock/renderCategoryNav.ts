// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCategoryNav.ts
// Version: 1.1.0-no-manual-protect
// [CHANGELOG]
// - Удалили manual protect_content. rely on monkey-patch.

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import { storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { paginateCategoryItems } from './paginateCategoryItems';
import { renderProductCard } from './renderProductCard';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';

async function clearPageMessages(ctx: BotContext): Promise<void> {
  if (!ctx.session.categoryPageMessages || !ctx.session.categoryPageMessages.length) return;
  if (!ctx.chat?.id) return;

  for (const msgId of ctx.session.categoryPageMessages) {
    try {
      await ctx.api.deleteMessage(ctx.chat.id, msgId);
    } catch (err) {
      // игнорируем
    }
  }
  ctx.session.categoryPageMessages = [];
}

export async function renderCategoryNav(
  ctx: BotContext,
  payload: Payload,
  rawCategoryId: string,
  page: number,
  itemsPerPage: number,
  direction: 'next' | 'back'
): Promise<void> {
  try {
    await clearPageMessages(ctx);

    const categoryId = parseInt(rawCategoryId, 10);
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
      const noMoreMsg = await ctx.reply("Нет больше товаров.");
      storeMessageId(ctx, noMoreMsg.message_id);
      return;
    }

    if (!ctx.session.categoryPageMessages) {
      ctx.session.categoryPageMessages = [];
    }

    for (const product of products) {
      const productMsgId = await renderProductCard(ctx, product.id, payload);
      if (productMsgId) {
        ctx.session.categoryPageMessages.push(productMsgId);
      }
    }

    const navKeyboard = new InlineKeyboard();

    if (page === 1) {
      navKeyboard.text("Back", "layout|store_home_page");
    } else {
      navKeyboard.text("Back", `catalogBackPage|${categoryId}|${page - 1}|${itemsPerPage}`);
    }

    if (page < totalPages) {
      navKeyboard.text("Next", `catalogLoadMore|${categoryId}|${page + 1}|${itemsPerPage}`);
    }

    const navMsg = await ctx.reply(`Страница: ${page} из ${totalPages}`, {
      parse_mode: 'HTML',
      reply_markup: navKeyboard,
    });
    storeMessageId(ctx, navMsg.message_id);
    ctx.session.categoryPageMessages.push(navMsg.message_id);

    log('info', `renderCategoryNav: page=${page}, direction=${direction}, catId=${categoryId}`, payload);
  } catch (error: any) {
    log('error', `Ошибка renderCategoryNav: ${error.message}`, payload);
    const errMsg = await ctx.reply("Ошибка при подгрузке товаров.");
    storeMessageId(ctx, errMsg.message_id);
  }
}
