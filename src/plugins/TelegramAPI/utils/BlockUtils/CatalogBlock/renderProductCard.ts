// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderProductCard.ts
// Version: 1.0.13-refactored
//
// [CHANGELOG]
// - Удалён вызов clearPreviousMessages(ctx).
// - Добавлена опция protect_content в параметры отправки сообщения, если бот настроен на защиту контента.

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

const DEMO_IMAGE_URL = "https://kvartiry-tbilisi.ru/images/demo/product_banner.png";

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
    const result = await payload.find({
      collection: 'products',
      where: { id: { equals: productId } },
      limit: 1,
    });
    const product = result.docs[0];
    if (!product) {
      const msg = await ctx.reply("Продукт не найден.", {
        parse_mode: 'HTML',
        protect_content: ctx.session.botConfig?.protectContent || false,
      });
      storeMessageId(ctx, msg.message_id);
      log('error', `Продукт с ID ${productId} не найден.`, payload);
      return;
    }
    const { name, price, description } = product as any;
    let messageText = `<b>${name}</b>\n<b>Цена:</b> $${price}\n`;
    messageText += `<b>Описание:</b> ${description || 'Нет описания'}\n`;
    const keyboard = new InlineKeyboard()
      .text("Назад", `catalogBack|${productId}`)
      .text("Заказать", `order|${productId}`);
    const cardMsg = await ctx.replyWithPhoto(DEMO_IMAGE_URL, {
      caption: messageText,
      parse_mode: 'HTML',
      reply_markup: keyboard,
      protect_content: ctx.session.botConfig?.protectContent || false,
    });
    storeMessageId(ctx, cardMsg.message_id);
    log('info', `Карточка продукта с ID ${productId} успешно отправлена.`, payload);
  } catch (error: any) {
    log('error', `Ошибка при отображении карточки продукта: ${error.message}`, payload);
    await ctx.reply("Произошла ошибка при загрузке информации о продукте.", {
      parse_mode: 'HTML',
      protect_content: ctx.session.botConfig?.protectContent || false,
    });
  }
}
