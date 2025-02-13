// Path: src/blocks/TelegramAPI/CatalogBlock/renderCatalogBlock.ts
// Version: 1.4.3-refactored
//
// [CHANGELOG]
// - Формат callback‑данных для кнопок категорий: "catalogCategory|<categoryId>|<itemsPerPage>".
// - Добавлена опция protect_content, если бот настроен на защиту контента.

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { storeMessageId } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

export async function renderCatalogBlock(
  ctx: BotContext,
  block: any,
  payload: Payload
): Promise<void> {
  try {
    if (!ctx.chat) {
      log('error', 'Контекст чата отсутствует.', payload);
      return;
    }
    const categoriesResult = await payload.find({
      collection: 'product-categories',
      where: { parent_id: { equals: null } },
      limit: 999,
    });
    const categories = categoriesResult.docs;
    if (categories.length === 0) {
      const emptyMsg = await ctx.reply('Категории отсутствуют.');
      storeMessageId(ctx, emptyMsg.message_id);
      log('info', 'Категории для отображения отсутствуют.', payload);
      return;
    }
    const inlineKeyboard = new InlineKeyboard();
    const itemsPerPage = block.itemsPerPage ?? 3;
    categories.forEach((category: any, index: number) => {
      inlineKeyboard.text(category.name, `catalogCategory|${category.id}|${itemsPerPage}`);
      if ((index + 1) % 2 === 0) inlineKeyboard.row();
    });
    const bannerUrl = block.banner || 'https://kvartiry-tbilisi.ru/images/demo/catalog_banner-1.png';
    const description = block.description || 'Пожалуйста, выберите категорию:';
    const catalogMsg = await ctx.replyWithPhoto(bannerUrl, {
      caption: description,
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard,
      protect_content: ctx.session.botConfig?.protectContent || false,
    });
    storeMessageId(ctx, catalogMsg.message_id);
    log('info', `Главная страница CatalogBlock успешно отображена для пользователя ${ctx.from?.id}`, payload);
  } catch (error: any) {
    log('error', `Ошибка отображения CatalogBlock: ${error.message}`, payload);
    const errorMsg = await ctx.reply('Произошла ошибка при загрузке каталога.');
    if (errorMsg?.message_id) {
      storeMessageId(ctx, errorMsg.message_id);
    }
  }
}
