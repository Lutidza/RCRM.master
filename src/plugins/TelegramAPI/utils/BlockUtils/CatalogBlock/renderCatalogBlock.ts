// 📌 Путь: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCatalogBlock.ts
// 📌 Версия: 1.3.2
//
// [CHANGELOG]
// - Добавлено логирование перед сохранением ID сообщения.
// - Улучшена проверка наличия message_id.

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import type { BotContext } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

export async function renderCatalogBlock(
  ctx: BotContext,
  block: any,
  payload: Payload
): Promise<void> {
  try {
    if (!ctx.chat) {
      log('error', 'Контекст чата отсутствует.', undefined);
      return;
    }

    const chatId = ctx.chat.id;
    const inlineKeyboard = new InlineKeyboard();

    const categoriesResult = await payload.find({
      collection: 'product-categories',
      where: { parent_id: { equals: null } },
      limit: 999,
    });

    const categories = categoriesResult.docs;

    if (categories.length === 0) {
      const emptyMsg = await ctx.reply('Категории отсутствуют.');
      storeMessageId(ctx, emptyMsg.message_id);
      log('info', 'Категории отсутствуют.', payload);
      return;
    }

    categories.forEach((category: any, index: number) => {
      inlineKeyboard.text(category.name, `catalogCategory|${category.id}`);
      if ((index + 1) % 2 === 0) inlineKeyboard.row();
    });

    const bannerUrl = block.banner || 'https://kvartiry-tbilisi.ru/images/demo/catalog_banner-1.png';
    const description = block.description || 'Пожалуйста, выберите категорию:';

    log('debug', `Отправка КаталогБлока. URL: ${bannerUrl}, Описание: ${description}`);

    const catalogMsg = await ctx.replyWithPhoto(bannerUrl, {
      caption: description,
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard,
    });

    if (catalogMsg?.message_id) {
      storeMessageId(ctx, catalogMsg.message_id);
      log(
        'debug',
        `Сообщение с описанием КаталогБлока добавлено в сессию. ID: ${catalogMsg.message_id}, Текущие сообщения: ${JSON.stringify(
          ctx.session.previousMessages
        )}`
      );
    } else {
      log('error', 'Ошибка: message_id отсутствует в ответе Telegram API.');
    }
  } catch (error: any) {
    log('error', `Ошибка отображения CatalogBlock: ${error.message}`, payload);
    const errorMsg = await ctx.reply('Произошла ошибка при загрузке каталога.');
    if (errorMsg?.message_id) {
      storeMessageId(ctx, errorMsg.message_id);
    }
  }
}
