// Path: src/plugins/TelegramAPI/utils/BlockUtils/ButtonBlock/ButtonBlock.ts
// Version: 1.1.3-refactored
//
// [CHANGELOG]
// - Если поле description в ButtonBlock не заполнено, используется значение по умолчанию "ButtonBlock".
// - Если ButtonBlock используется отдельно, текст описания выводится как сообщение с кнопками.
// - Если ButtonBlock является дочерним блоком MessageBlock, утилита MessageBlock игнорирует описание.

import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { InlineKeyboard } from 'grammy';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';

/**
 * Обработка кнопочного блока.
 * @param {BotContext} ctx - Контекст Telegram бота.
 * @param {any} buttonBlock - Объект кнопочного блока.
 * @param {string} [defaultDescription] - Описание блока кнопок, если поле description не задано в buttonBlock.
 */
export async function handleButtonBlock(
  ctx: BotContext,
  buttonBlock: any,
  defaultDescription = 'ButtonBlock'
): Promise<void> {
  if (!ctx.chat) {
    log('error', 'Контекст чата отсутствует.', undefined);
    return;
  }

  // Проверка наличия кнопок
  if (!Array.isArray(buttonBlock.buttons) || buttonBlock.buttons.length === 0) {
    log('error', 'Кнопочный блок не содержит кнопок.', undefined);
    const emptyMsg = await ctx.reply('Кнопочный блок пуст. Пожалуйста, настройте кнопки.');
    storeMessageId(ctx, emptyMsg.message_id);
    return;
  }

  // Используем описание из buttonBlock, если оно задано, иначе значение по умолчанию.
  const description = buttonBlock.description || defaultDescription;

  const inlineKeyboard = new InlineKeyboard();

  // Генерация кнопок
  buttonBlock.buttons.forEach((btn: any) => {
    try {
      const callbackData = btn.callback_data || '';
      const buttonText = btn.text;

      switch (btn.callbackType) {
        case 'layout':
        case 'message':
        case 'command':
          inlineKeyboard.text(buttonText, `${btn.callbackType}|${callbackData}`);
          break;
        case 'link':
          inlineKeyboard.url(buttonText, btn.url || '');
          break;
        default:
          inlineKeyboard.text(buttonText, callbackData);
      }

      if (btn.newRow) {
        inlineKeyboard.row();
      }
    } catch (error: any) {
      log('error', `Ошибка при генерации кнопки: ${error.message}`, undefined);
    }
  });

  // Отправка сообщения с кнопками
  try {
    const buttonMsg = await ctx.reply(description, { reply_markup: inlineKeyboard });
    storeMessageId(ctx, buttonMsg.message_id);
    log('info', `Кнопки успешно отправлены. Сообщение ID: ${buttonMsg.message_id}`, undefined);
  } catch (error: any) {
    log('error', `Ошибка отправки кнопок: ${error.message}`, undefined);
  }
}
