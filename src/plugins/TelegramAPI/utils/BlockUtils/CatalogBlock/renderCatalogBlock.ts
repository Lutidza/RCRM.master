// Path: src/blocks/TelegramAPI/CatalogBlock/renderCatalogBlock.ts
// Version: 1.4.2
//
// [CHANGELOG]
// - Изменён формат callback‑данных для кнопок категорий: теперь передаётся значение itemsPerPage из настроек блока.
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
      log('error', 'Контекст чата отсутствует.', payload);
      return;
    }

    // Запрашиваем все категории верхнего уровня
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
    // Определяем значение itemsPerPage из настроек блока (если отсутствует – по умолчанию 3)
    const itemsPerPage = block.itemsPerPage ?? 3;
    // Формируем callback данные в формате: "catalogCategory|<categoryId>|<itemsPerPage>"
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
