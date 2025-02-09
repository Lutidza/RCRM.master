// 📌 Путь: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCategoryItemsLoadMore.ts
// 📌 Версия: 1.0.37
//
// [CHANGELOG]
// - Добавлено логирование через log вместо console.log.
// - Улучшена обработка ошибок с использованием log.
// - Оптимизированы комментарии и улучшена читаемость кода.

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import {
  BotContext,
  storeMessageId,
} from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

const DEMO_PRODUCT_IMAGE_URL = "https://kvartiry-tbilisi.ru/images/demo/product_banner.png";

/**
 * Функция для подгрузки товаров в категории.
 * @param {BotContext} ctx - Контекст Telegram бота.
 * @param {string} categoryId - Идентификатор категории.
 * @param {Payload} payload - Экземпляр Payload CMS.
 * @param {number} page - Текущая страница.
 * @param {number} [itemsPerPage=3] - Количество товаров на страницу.
 * @returns {Promise<void>}
 */
export async function renderCategoryItemsLoadMore(
  ctx: BotContext,
  categoryId: string,
  payload: Payload,
  page: number,
  itemsPerPage: number = 3
): Promise<void> {
  try {
    log('info', `Подгружаем товары для категории ${categoryId}, страница ${page}, itemsPerPage=${itemsPerPage}`, payload);

    // Загружаем товары из категории
    const productsResult = await payload.find({
      collection: 'products',
      where: { category_ids: { in: [categoryId] } },
      sort: 'name',
      limit: 999,
    });

    const products = productsResult.docs;
    const totalPages = Math.ceil(products.length / itemsPerPage);
    const currentProducts = products.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    if (currentProducts.length === 0) {
      const noMoreMsg = await ctx.reply("Нет больше товаров.", { parse_mode: 'HTML' });
      storeMessageId(ctx, noMoreMsg.message_id);
      log('info', `Товары закончились для категории ${categoryId}`, payload);
      return;
    }

    // Отображение текущих товаров
    for (const prod of currentProducts) {
      if (!prod.id) {
        log('error', `Пропущен продукт без ID: ${JSON.stringify(prod)}`, payload);
        continue;
      }

      const productKeyboard = new InlineKeyboard()
        .text("Подробнее", `catalogProductDetails|${prod.id}`)
        .text("Купить", `catalogBuyNow|${prod.id}`);

      const productMsg = await ctx.replyWithPhoto(DEMO_PRODUCT_IMAGE_URL, {
        caption: `<b>${prod.name}</b>\n<b>Цена:</b> ${prod.price ? `$${prod.price}` : 'N/A'}\n<b>Статус:</b> ${prod.status ?? 'Неизвестно'}`,
        parse_mode: 'HTML',
        reply_markup: productKeyboard,
      });
      storeMessageId(ctx, productMsg.message_id);
    }

    // Если есть следующая страница, добавляем кнопку "Загрузить ещё"
    if (page < totalPages) {
      const nextPage = page + 1;
      const navKeyboard = new InlineKeyboard()
        .text("Загрузить ещё", `catalogLoadMore|${categoryId}|${nextPage}|${itemsPerPage}`);

      const navMsg = await ctx.reply(`Страница ${page} из ${totalPages}`, {
        parse_mode: 'HTML',
        reply_markup: navKeyboard,
      });
      storeMessageId(ctx, navMsg.message_id);
    }
  } catch (error: any) {
    log('error', `Ошибка в renderCategoryItemsLoadMore: ${error.message}`, payload);
    await ctx.reply("Произошла ошибка при подгрузке товаров.");
  }
}
