// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderProductDetails.ts
// Version: 1.0.0
// [CHANGELOG]
// - Отображает детальную карточку (полное описание, галерея фото, и т. д.)
// - Кнопки: «В корзину», «Назад», «Заказать» (примерно)

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

export async function renderProductDetails(
  ctx: BotContext,
  productId: string | number,
  payload: Payload
): Promise<number | null> {
  try {
    if (!ctx.chat) {
      log('error', 'renderProductDetails: Контекст чата отсутствует.', payload);
      return null;
    }

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
      return notFoundMsg.message_id;
    }

    const { name, price, size, status, images, description } = product as any;
    const statusAlias = (status?.alias) ? status.alias : 'N/A';

    let detailsText = `<b>${name}</b>\n`;
    detailsText += `<b>Цена:</b> ${price}$\n`;
    detailsText += `<b>Размер:</b> ${size}\n`;
    detailsText += `<b>Статус:</b> ${statusAlias}\n\n`;
    detailsText += `<b>Описание:</b>\n${description || 'Нет описания'}\n\n`;
    detailsText += `Выберите действие:`;

    const keyboard = new InlineKeyboard()
      .text("В корзину", `addToCart|${product.id}`)
      .text("Назад", `catalogBackPage|${product.id}|1|3`) // Пример "Назад"
      .row()
      .text("Заказать", `order|${product.id}`);

    const mainPhotoUrl = (Array.isArray(images) && images.length > 0)
      ? images[0].url
      : 'https://kvartiry-tbilisi.ru/images/demo/product_banner.png';

    const msg = await ctx.replyWithPhoto(mainPhotoUrl, {
      caption: detailsText,
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
    storeMessageId(ctx, msg.message_id);

    log('info', `renderProductDetails: Товар ID ${product.id} (детальная карточка) отправлен.`, payload);
    return msg.message_id;
  } catch (error: any) {
    log('error', `renderProductDetails: Ошибка при выводе детальной карточки: ${error.message}`, payload);
    const errMsg = await ctx.reply("Произошла ошибка при загрузке детальной информации о товаре.");
    storeMessageId(ctx, errMsg.message_id);
    return null;
  }
}
