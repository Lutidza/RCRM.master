// 📌 Путь: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderProductCard.ts
// 📌 Версия: 1.0.11
//
// [CHANGELOG]
// - Улучшена обработка ошибок с использованием Logger log.
// - Оптимизирован код для работы с product.
// - Обновлены комментарии для большей ясности.

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import {
  clearPreviousMessages,
  storeMessageId,
  BotContext,
} from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

const DEMO_IMAGE_URL = "https://kvartiry-tbilisi.ru/images/demo/product_banner.png";

/**
 * Отображение карточки продукта.
 * @param {BotContext} ctx - Контекст Telegram бота.
 * @param {string} productId - Идентификатор продукта.
 * @param {Payload} payload - Экземпляр Payload CMS.
 * @returns {Promise<void>}
 */
export async function renderProductCard(
  ctx: BotContext,
  productId: string,
  payload: Payload
): Promise<void> {
  try {
    if (!ctx.chat) {
      log('error', 'Контекст чата отсутствует.', payload);
      return;
    }

    await clearPreviousMessages(ctx);

    // Поиск продукта
    const result = await payload.find({
      collection: 'products',
      where: { id: { equals: productId } },
      limit: 1,
    });

    const product = result.docs[0];
    if (!product) {
      const msgNoProduct = await ctx.reply("Продукт не найден.", { parse_mode: 'HTML' });
      storeMessageId(ctx, msgNoProduct.message_id);
      log('error', `Продукт с ID ${productId} не найден.`, payload);
      return;
    }

    // Извлечение данных продукта
    const { name, price, description, labels_ids, quantity } = product as any;
    let messageText = `<b>${name}</b>\n<b>Цена:</b> $${price}\n`;
    messageText += `<b>Количество:</b> ${quantity ?? 'N/A'}\n`;
    messageText += `<b>Описание:</b> ${description || 'Нет описания'}\n`;

    // Обработка меток
    if (Array.isArray(labels_ids) && labels_ids.length > 0) {
      const labelsText = labels_ids
        .map((label: any) =>
          typeof label === 'object' && label.label ? label.label : label
        )
        .join(', ');
      messageText += `<b>Метки:</b> ${labelsText}\n`;
    }

    // Создание клавиатуры
    const keyboard = new InlineKeyboard()
      .text("Назад", `catalogBack|${productId}`)
      .text("Заказать", `order|${productId}`);

    // Отправка карточки
    const cardMsg = await ctx.replyWithPhoto(DEMO_IMAGE_URL, {
      caption: messageText,
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
    storeMessageId(ctx, cardMsg.message_id);
    log('info', `Карточка продукта с ID ${productId} успешно отправлена.`, payload);

  } catch (error: any) {
    log('error', `Ошибка при отображении карточки продукта: ${error.message}`, payload);
    await ctx.reply(
      "Произошла ошибка при загрузке информации о продукте.",
      { parse_mode: 'HTML' }
    );
  }
}
