// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderProductCard.ts
// Version: 1.0.14-no-manual-protect
// [CHANGELOG]
// - Удалили manual protect_content. rely on monkey-patch.

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

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
    const { name, price, description } = product as any;
    let messageText = `<b>${name}</b>\n<b>Цена:</b> $${price}\n`;
    messageText += `<b>Описание:</b> ${description || 'Нет описания'}\n`;

    const keyboard = new InlineKeyboard()
      .text("Назад", `catalogBack|${productId}`)
      .text("Заказать", `order|${productId}`);

    const cardMsg = await ctx.replyWithPhoto("https://kvartiry-tbilisi.ru/images/demo/product_banner.png", {
      caption: messageText,
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
    storeMessageId(ctx, cardMsg.message_id);

    log('info', `Карточка продукта с ID ${productId} успешно отправлена.`, payload);
    return cardMsg.message_id;
  } catch (error: any) {
    log('error', `Ошибка при отображении карточки продукта: ${error.message}`, payload);
    const errMsg = await ctx.reply("Произошла ошибка при загрузке информации о продукте.");
    storeMessageId(ctx, errMsg.message_id);
    return null;
  }
}
