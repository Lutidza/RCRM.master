// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderProductSnippet.ts
// Version: 1.6.2-with-logs
// [CHANGELOG]
// - depth: 2 (гарантирует раскрытие status при условии, что relationship настроен верно)
// - Добавлены console.log('[DEBUG product]') и console.log('[DEBUG product.status]')

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

const DEMO_IMAGE_URL = "https://kvartiry-tbilisi.ru/images/demo/product_banner.png";

function mapSizeToIcon(size: number): string {
  const sizeMap: Record<number, string> = {
    1: '①', 2: '②', 3: '③', 4: '④', 5: '⑤',
    6: '⑥', 7: '⑦', 8: '⑧', 9: '⑨', 10: '⑩',
    11: '⑪', 12: '⑫', 13: '⑬', 14: '⑭', 15: '⑮',
    16: '⑯', 17: '⑰', 18: '⑱', 19: '⑲', 20: '⑳',
  };
  return sizeMap[size] || String(size);
}

export async function renderProductSnippet(
  ctx: BotContext,
  productId: string | number,
  payload: Payload
): Promise<number | null> {
  try {
    if (!ctx.chat) {
      log('error', 'renderProductSnippet: Контекст чата отсутствует.', payload);
      return null;
    }

    // depth: 2, чтобы гарантировать раскрытие поля "status"
    const result = await payload.find({
      collection: 'products',
      where: { id: { equals: productId } },
      limit: 1,
      depth: 2,
    });
    const product = result.docs[0];
    if (!product) {
      const notFoundMsg = await ctx.reply("Товар не найден.");
      storeMessageId(ctx, notFoundMsg.message_id);
      return notFoundMsg.message_id;
    }

    // Логируем весь товар
    console.log('[DEBUG product]:', JSON.stringify(product, null, 2));
    // Логируем конкретно поле status
    console.log('[DEBUG product.status]:', JSON.stringify(product.status, null, 2));

    const {
      name = 'Unnamed',
      price = 0,
      size,
      status,
      images,
      labels_ids,
    } = product as any;

    // Преобразуем размер
    const sizeNum = (typeof size === 'number') ? size : parseInt(size, 10);
    const sizeIcon = mapSizeToIcon(sizeNum);

    // Статус: label или alias, иначе N/A
    const statusText = status?.label ?? status?.alias ?? 'N/A';

    // Лейблы: объединяем через пробел
    let labelLine = '';
    if (Array.isArray(labels_ids) && labels_ids.length > 0) {
      const labelStrings = labels_ids.map((lbl: any) => lbl.label ?? lbl.alias).filter(Boolean);
      labelLine = labelStrings.join(' ');
    }

    let firstLine = `<b>${name} — ${sizeIcon}  `;
    if (labelLine) {
      firstLine += `${labelLine}  `;
    }
    firstLine += `${statusText}</b>`;

    const secondLine = `<b>Price: $${price}</b>`;
    const snippetText = `${firstLine}\n${secondLine}`;

    const photoUrl = (Array.isArray(images) && images.length > 0)
      ? images[0].url
      : DEMO_IMAGE_URL;

    const keyboard = new InlineKeyboard()
      .text("Подробно", `productDetails|${product.id}`)
      .text("Заказать", `order|${product.id}`);

    const snippetMsg = await ctx.replyWithPhoto(photoUrl, {
      caption: snippetText,
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
    storeMessageId(ctx, snippetMsg.message_id);

    log('info', `renderProductSnippet: Товар ID ${product.id} (короткая карточка) отправлен.`, payload);
    return snippetMsg.message_id;
  } catch (error: any) {
    log('error', `renderProductSnippet: Ошибка при выводе сниппета: ${error.message}`, payload);
    const errMsg = await ctx.reply("Произошла ошибка при загрузке информации о товаре.");
    storeMessageId(ctx, errMsg.message_id);
    return null;
  }
}
