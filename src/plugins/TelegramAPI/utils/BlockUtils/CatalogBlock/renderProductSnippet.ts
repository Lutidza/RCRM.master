// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderProductSnippet.ts
// Version: 1.1.0-with-discount
//
// [CHANGELOG]
// 1. Добавлен mapSizeToIcon(size): если 1..20 -> символ "①...⑳", иначе возвращаем само число.
// 2. Убраны неподдерживаемые теги (<blockquote> и т. д.), но сохранена остальная структура (пробелы, переносы строк).
// 3. Если товар имеет images (media) не пустое -> показываем DEMO_IMAGE_URL, иначе отправляем сообщение без фото.
// 4. Добавлена логика скидки: если discount.enabled='enabled' и (now в интервале [start_date..end_date]),
//    то вычисляем новую цену. Выводим Old Price и New Price.
//
// Пример итогового текста (учитывая spacing и переносы):
//
//  <b>Juicy Pear — ② | 🔥HOT</b>
//  <b>Price:</b> $29
//  ✅ Available
//
// Если скидка активна:
//  <b>Old Price:</b> $29
//  <b>New Price:</b> $26.10
//
// ---------------------------------------------------------------------

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

const DEMO_IMAGE_URL = "https://kvartiry-tbilisi.ru/images/demo/product_banner-7.png";

/**
 * Маппинг размеров 1..20 в символы ①..⑳, если >20 -> возвращаем само число.
 */
function mapSizeToIcon(size: number): string {
  const icons = [
    '①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩',
    '⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳',
  ];
  if (size >= 1 && size <= 20) {
    // добавляем ! в конце, чтобы сказать TS, что тут не будет undefined
    return icons[size - 1]!;
  }
  return size.toString();
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

    // 1) Загружаем товар
    const productResult = await payload.find({
      collection: 'products',
      where: { id: { equals: productId } },
      limit: 1,
    });
    const product = productResult.docs[0];
    if (!product) {
      const notFoundMsg = await ctx.reply("Товар не найден.");
      storeMessageId(ctx, notFoundMsg.message_id);
      return notFoundMsg.message_id;
    }

    const {
      name,
      price,
      size,
      status,
      labels_ids,
      images,
      discount, // relationship (может быть undefined или объектом { id: number } без depth)
    } = product as any;

    // 2) Логика расчёта скидки
    let finalPrice = price;
    let discountActive = false;
    let discountText = ''; // сформируем текст "Old Price / New Price" при необходимости

    if (discount && discount.id) {
      // Пытаемся загрузить документ скидки
      const discountResult = await payload.find({
        collection: 'discounts',
        where: { id: { equals: discount.id } },
        limit: 1,
      });
      const discountDoc = discountResult.docs[0];
      if (discountDoc) {
        // Проверяем enabled, дату начала / конца
        if (discountDoc.enabled === 'enabled') {
          const now = new Date();
          const startDate = discountDoc.start_date ? new Date(discountDoc.start_date) : null;
          const endDate = discountDoc.end_date ? new Date(discountDoc.end_date) : null;

          if (
            startDate && endDate &&
            now >= startDate && now <= endDate
          ) {
            // Скидка активна
            discountActive = true;
            // Считаем новую цену
            if (discountDoc.discount_percentage) {
              finalPrice = finalPrice * (1 - discountDoc.discount_percentage / 100);
            }
            if (discountDoc.discount_fixed_amount) {
              finalPrice = finalPrice - discountDoc.discount_fixed_amount;
            }
            if (finalPrice < 0) {
              finalPrice = 0; // не допускаем отрицательных цен
            }

            discountText =
              `\n<b>Old Price:</b> $${price}\n` +
              `<b>New Price:</b> $${finalPrice.toFixed(2)}`;
          }
        }
      }
    }

    // 3) Формируем текст сниппета

    // Лейблы (если есть)
    let labelsText = '';
    if (Array.isArray(labels_ids) && labels_ids.length > 0) {
      const labelArr = labels_ids.map((lbl: any) => lbl.label ?? lbl.alias ?? '');
      labelsText = labelArr.join(' ');
    }

    // Статус
    let statusText = 'N/A';
    if (typeof status === 'object' && (status.label || status.alias)) {
      statusText = status.label ?? status.alias ?? 'N/A';
    } else if (typeof status === 'number') {
      // Без достаточного depth может прийти число
      statusText = `[#${status}]`;
    }

    // Маппинг size -> иконка
    const sizeIcon = mapSizeToIcon(size);

    // Собираем HTML (учитывая пробелы и переносы)
    // Пример:
    // <b>Juicy Pear — ② | 🔥HOT</b>
    // <b>Price:</b> $29
    // ✅ In stock
    // Если скидка активна: добавляем Old Price / New Price
    let snippetText = `<b>${name} — ${sizeIcon}`;
    if (labelsText) {
      snippetText += ` | ${labelsText}`;
    }
    snippetText += `</b>\n`;
    snippetText += `<b>Price:</b> $${price}\n`;
    snippetText += `✅ ${statusText}`;

    if (discountActive && discountText) {
      snippetText += discountText; // добавляем Old Price / New Price
    }

    // 4) Кнопки
    const inlineKeyboard = new InlineKeyboard()
      .text("Подробно", `productDetails|${product.id}`)
      .text("Заказать", `order|${product.id}`);

    // 5) Логика для картинки:
    const hasMedia = Array.isArray(images) && images.length > 0;
    let msgId: number;
    if (hasMedia) {
      // Отправляем DEMO_IMAGE_URL
      const photoMsg = await ctx.replyWithPhoto(DEMO_IMAGE_URL, {
        caption: snippetText,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
      });
      msgId = photoMsg.message_id;
    } else {
      // Без фото, только текст
      const textMsg = await ctx.reply(snippetText, {
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
      });
      msgId = textMsg.message_id;
    }

    storeMessageId(ctx, msgId);
    log('info', `renderProductSnippet: Товар ID=${productId} (короткая карточка) отправлен.`, payload);
    return msgId;

  } catch (error: any) {
    log('error', `renderProductSnippet: Ошибка при выводе сниппета: ${error.message}`, payload);
    const errMsg = await ctx.reply("Произошла ошибка при загрузке информации о товаре.");
    storeMessageId(ctx, errMsg.message_id);
    return null;
  }
}
