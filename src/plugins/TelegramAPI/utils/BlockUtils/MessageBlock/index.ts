// Path: src/plugins/TelegramAPI/utils/BlockUtils/MessageBlock/index.ts
// Version: 1.0.10
//
// This utility processes a MessageBlock by sending its content using HTML formatting via grammY.
// For testing purposes, if a media file is attached, a fixed URL is used.
// Now, if a MessageBlock contains a "buttons" field (provided via ButtonBlock),
// the buttons are attached to the same message via an inline keyboard.
// In this case, any description from ButtonBlock is ignored – only the array of buttons is used.

import type { Context, SessionFlavor } from 'grammy';
import { InlineKeyboard } from 'grammy';

// Локальное объявление типа BotContext (для удобства). В реальном проекте можно использовать импорт из общего файла.
interface SessionData {
  previousMessages: number[];
}
type BotContext = Context & SessionFlavor<SessionData>;

/**
 * For testing purposes, returns a fixed media URL.
 * In production, use getAbsoluteMediaUrl to compute the absolute URL.
 *
 * @param url - The media file URL.
 * @returns The fixed test media URL.
 */
function getTestMediaUrl(url: string): string {
  console.log(`[DEBUG] Overriding media URL for testing. Original URL: "${url}"`);
  return "https://kvartiry-tbilisi.ru/images/resize/medium/c77626871d5920df7195a89cc44a2c85.jpg";
}

/**
 * Constructs an inline keyboard from an array of button objects.
 *
 * @param buttons - Array of button objects.
 * @returns An InlineKeyboard instance.
 */
function buildInlineKeyboard(buttons: any[]): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  buttons.forEach((btn: any) => {
    // Поскольку поле text обязательно, используем его напрямую.
    if (btn.callbackType === 'link' && btn.url) {
      keyboard.url(btn.text, btn.url);
    } else {
      // Формируем callback_data с префиксом типа (например, "layout|store_home_page")
      const callbackData = btn.callback_data || '';
      const data = `${btn.callbackType}|${callbackData}`;
      keyboard.text(btn.text, data);
    }
    if (btn.newRow) {
      keyboard.row();
    }
  });
  return keyboard;
}

export async function processMessageBlock(ctx: BotContext, blockData: any): Promise<void> {
  if (!ctx.chat) return;

  // Обязательное поле text из MessageBlock
  const text: string = blockData.text;

  try {
    // Готовим опции для отправки сообщения
    const replyOptions: any = {
      parse_mode: 'HTML',
    };

    // Обработка кнопок: если поле buttons присутствует, пытаемся извлечь кнопки.
    let buttonsArray: any[] = [];
    if (Array.isArray(blockData.buttons) && blockData.buttons.length > 0) {
      // Если используется обёртка ButtonBlock, где помимо массива кнопок присутствует также поле description,
      // то извлекаем только сами кнопки.
      if (blockData.buttons[0]?.buttons) {
        blockData.buttons.forEach((btnBlock: any) => {
          if (Array.isArray(btnBlock.buttons)) {
            buttonsArray = buttonsArray.concat(btnBlock.buttons);
          }
        });
      } else {
        // Иначе blockData.buttons – это массив кнопок напрямую.
        buttonsArray = blockData.buttons;
      }
      if (buttonsArray.length > 0) {
        replyOptions.reply_markup = buildInlineKeyboard(buttonsArray);
      }
    }

    let sentMsg;
    // Если media задан и не пустой, используем фиксированный URL для тестирования.
    if (blockData.media && typeof blockData.media.url === 'string' && blockData.media.url.trim() !== "") {
      const mediaUrl = getTestMediaUrl(blockData.media.url);
      console.log(`[DEBUG] blockData.media:`);
      console.dir(blockData.media, { depth: null });
      console.log(`[DEBUG] Sending photo with test URL: "${mediaUrl}" and caption: "${text}"`);
      sentMsg = await ctx.replyWithPhoto(mediaUrl, {
        caption: text,
        ...replyOptions,
      });
    } else {
      sentMsg = await ctx.reply(text, replyOptions);
    }
    if (ctx.session && Array.isArray(ctx.session.previousMessages)) {
      ctx.session.previousMessages.push(sentMsg.message_id);
      console.log(`[DEBUG] Stored message ID: ${sentMsg.message_id}. Current previousMessages: ${ctx.session.previousMessages}`);
    }
  } catch (error: any) {
    console.error('Error processing MessageBlock:', error);
  }
}
