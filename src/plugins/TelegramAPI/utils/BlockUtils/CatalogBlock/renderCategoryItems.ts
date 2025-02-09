// 📌 Путь: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCategoryItems.ts
// 📌 Версия: 1.4.7
//
// [CHANGELOG]
// - Добавлено удаление всех предыдущих сообщений (включая блоки с кнопками) перед выводом категорий и товаров.
// - Устранены проблемы с некорректным сохранением ID сообщений.

import type { Payload } from 'payload';
import type { BotContext } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { clearPreviousMessages, storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { InlineKeyboard } from 'grammy';
import { paginateCategoryItems } from './paginateCategoryItems';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

// Заглушки для медиа
const DEFAULT_CATEGORY_MEDIA = [
  {
    url: 'https://kvartiry-tbilisi.ru/images/demo/product_banner-1.png',
  },
];
const DEFAULT_PRODUCT_MEDIA = [
  {
    url: 'https://kvartiry-tbilisi.ru/images/demo/product_banner-1.png',
  },
];

/**
 * Функция для отображения элементов категории.
 * @param {BotContext} ctx - Контекст Telegram бота.
 * @param {string} categoryId - Идентификатор категории (строка, полученная из Telegram callback).
 * @param {PaginationOptions} paginationOptions - Опции пагинации.
 * @param {Payload} payload - Экземпляр Payload CMS.
 * @param {boolean} clearMessages - Удалять ли предыдущие сообщения перед выводом.
 * @returns {Promise<void>}
 */
export async function renderCategoryItems(
  ctx: BotContext,
  categoryId: string,
  paginationOptions: { page: number; itemsPerPage: number },
  payload: Payload,
  clearMessages: boolean = true // Удаление сообщений включено по умолчанию
): Promise<void> {
  try {
    if (!ctx.chat) {
      log('error', 'Контекст чата отсутствует.', payload);
      return;
    }

    const parsedCategoryId = parseInt(categoryId, 10);
    if (isNaN(parsedCategoryId)) {
      log('error', `Некорректный идентификатор категории: "${categoryId}".`, payload);
      await ctx.reply('Ошибка: некорректный идентификатор категории.');
      return;
    }

    const { page, itemsPerPage } = paginationOptions;

    // Удаление предыдущих сообщений, если включено
    if (clearMessages) {
      await clearPreviousMessages(ctx);
    }

    // Получение текущей категории
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
      : DEFAULT_CATEGORY_MEDIA;

    // Отправка информации о категории
    const categoryCaption = `<b>${category.name}</b>\n${category.description || ''}`;
    const categoryMsg = await ctx.replyWithPhoto(categoryMedia[0].url, {
      caption: categoryCaption,
      parse_mode: 'HTML',
    });
    storeMessageId(ctx, categoryMsg.message_id);

    // Получение подкатегорий и продуктов с использованием пагинации
    const categories = await paginateCategoryItems(
      payload,
      'product-categories',
      { parent_id: { equals: parsedCategoryId } },
      page,
      itemsPerPage,
    );

    const products = await paginateCategoryItems(
      payload,
      'products',
      { category_ids: { in: [parsedCategoryId] } },
      page,
      itemsPerPage,
    );

    // Если категория пуста (нет подкатегорий и товаров)
    if (categories.length === 0 && products.length === 0) {
      const emptyMessage = await ctx.reply('Категория пуста. Нет данных для отображения.');
      storeMessageId(ctx, emptyMessage.message_id);
      return;
    }

    // Отправка подкатегорий
    if (categories.length > 0) {
      const categoryKeyboard = new InlineKeyboard();
      categories.forEach((cat: any, index: number) => {
        categoryKeyboard.text(cat.name, `catalogCategory|${cat.id}`);
        if ((index + 1) % 2 === 0) categoryKeyboard.row();
      });

      const subCategoryMsg = await ctx.reply('Подкатегории:', {
        reply_markup: categoryKeyboard,
      });
      storeMessageId(ctx, subCategoryMsg.message_id);
    }

    // Отправка товаров
    if (products.length > 0) {
      for (const product of products) {
        const productMedia = Array.isArray(product.media) && product.media.length > 0
          ? product.media
          : DEFAULT_PRODUCT_MEDIA;

        const productCaption = `<b>${product.name}</b>\n<b>Цена:</b> ${
          product.price ? `$${product.price}` : 'N/A'
        }\n<b>Статус:</b> ${product.status ?? 'Неизвестно'}`;

        const productKeyboard = new InlineKeyboard()
          .text('Details', `catalogProductDetails|${product.id}`)
          .text('Buy Now', `catalogBuyNow|${product.id}`);

        const productMsg = await ctx.replyWithPhoto(productMedia[0].url, {
          caption: productCaption,
          parse_mode: 'HTML',
          reply_markup: productKeyboard,
        });

        storeMessageId(ctx, productMsg.message_id);
      }
    }

    log('info', `Элементы категории успешно отправлены для ID: ${categoryId}.`, payload);
  } catch (error: any) {
    log('error', `Ошибка при рендеринге элементов категории: ${error.message}`, payload);
    const errorMsg = await ctx.reply('Произошла ошибка при загрузке данных категории.');
    storeMessageId(ctx, errorMsg.message_id);
  }
}
