// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderProductCard.ts
// Version: 1.1.0-short-snippet
// [CHANGELOG]
// 1. Выводим короткую информацию о товаре: обложка, name, price, size, status.
// 2. Добавляем две кнопки: «Подробно» (productDetails|id) и «Заказать» (order|id).

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

const DEMO_IMAGE_URL = "https://kvartiry-tbilisi.ru/images/demo/product_banner.png";

export async function renderProductCard(
  ctx: BotContext,
  productId: string | number,
  payload: Payload
): Promise<number | null> {
  try {
    if (!ctx.chat) {
      log('error', 'Контекст чата отсутствует.', payload);
      return null;
    }

    const result = await payload.find({
      collection: 'products',
      where: { id: { equals: productId } },
      limit: 1,
    });
    const product = result.docs[0];
    if (!product) {
      const msg = await ctx.reply("Продукт не найден.");
      storeMessageId(ctx, msg.message_id);
      return msg.message_id;
    }

    const { name, price, size, status } = product as any;
    const statusAlias = status?.alias || 'N/A';

    let messageText = `<b>${name}</b>\n`;
    messageText += `<b>Цена:</b> $${price}\n`;
    messageText += `<b>Размер:</b> ${size}\n`;
    messageText += `<b>Статус:</b> ${statusAlias}\n`;

    const keyboard = new InlineKeyboard()
      .text("Подробно", `productDetails|${product.id}`)
      .text("Заказать", `order|${product.id}`);

    const cardMsg = await ctx.replyWithPhoto(DEMO_IMAGE_URL, {
      caption: messageText,
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
    storeMessageId(ctx, cardMsg.message_id);

    log('info', `Короткая карточка товара ID ${productId} успешно отправлена.`, payload);
    return cardMsg.message_id;
  } catch (error: any) {
    log('error', `Ошибка при отображении короткой карточки товара: ${error.message}`, payload);
    const errMsg = await ctx.reply("Произошла ошибка при загрузке информации о товаре.");
    storeMessageId(ctx, errMsg.message_id);
    return null;
  }
}
