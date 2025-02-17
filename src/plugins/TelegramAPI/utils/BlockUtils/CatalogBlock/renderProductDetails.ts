// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderProductDetails.ts
// Version: 1.1.0-clearAll
//
// [CHANGELOG]
// - Перед выводом детальной карточки вызываем clearPreviousMessages(ctx),
//   чтобы удалить все предыдущие сообщения.
// - Далее формируем "подробную" карточку товара (с более расширенной информацией).
// - Можно использовать ту же логику проверки фото, статуса, лейблов и т.д.

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { clearPreviousMessages, storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

const DEMO_IMAGE_URL = "https://kvartiry-tbilisi.ru/images/demo/product_banner.png";

export async function renderProductDetails(
  ctx: BotContext,
  productId: string | number,
  payload: Payload
): Promise<void> {
  try {
    if (!ctx.chat) {
      log('error', 'renderProductDetails: нет ctx.chat', payload);
      return;
    }

    // Удаляем все предыдущие сообщения
    await clearPreviousMessages(ctx);

    // Загружаем товар
    const result = await payload.find({
      collection: 'products',
      where: { id: { equals: productId } },
      limit: 1,
    });
    const product = result.docs[0];
    if (!product) {
      const notFoundMsg = await ctx.reply("Товар не найден.");
      storeMessageId(ctx, notFoundMsg.message_id);
      return;
    }

    // Извлекаем поля
    const { name, price, size, status, images, description, labels_ids } = product as any;
    const statusText = status?.label ?? status?.alias ?? 'N/A';

    // Лейблы
    let labelsText = '';
    if (Array.isArray(labels_ids) && labels_ids.length > 0) {
      labelsText = labels_ids.map((lbl: any) => lbl.label ?? lbl.alias).join(' ');
    }

    // Формируем HTML для детальной карточки
    // Пример:
    // <b>Juicy Pear — ①</b>   🔥HIT
    // <i>Price:</i> $33
    // <b>Status:</b> ✅ In stock
    // <b>Description:</b> ...
    // ...
    let detailsText = `<b>${name} — ${size}</b>`;
    if (labelsText) detailsText += `   ${labelsText}`;
    detailsText += `\n<i>Price:</i> $${price}\n`;
    detailsText += `<b>Status:</b> ${statusText}\n`;
    if (description) {
      detailsText += `<b>Description:</b>\n${description}\n`;
    }

    const photoUrl = (Array.isArray(images) && images[0]?.url?.startsWith('http'))
      ? images[0].url
      : DEMO_IMAGE_URL;

    // Кнопки. Например: "В корзину", "Back", "Заказать"
    const keyboard = new InlineKeyboard()
      .text("В корзину", `addToCart|${product.id}`)
      .text("Заказать", `order|${product.id}`)
      .row()
      .text("Back", `layout|store_home_page`); // или другая логика

    const msg = await ctx.replyWithPhoto(photoUrl, {
      caption: detailsText,
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
    storeMessageId(ctx, msg.message_id);

    log('info', `renderProductDetails: товар ID=${product.id} (детально)`, payload);

  } catch (err: any) {
    log('error', `renderProductDetails: Ошибка: ${err.message}`, payload);
    const errorMsg = await ctx.reply('Ошибка при загрузке детальной карточки товара.');
    storeMessageId(ctx, errorMsg.message_id);
  }
}
