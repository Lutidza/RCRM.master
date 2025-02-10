// 📌 Путь: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/index.TelegramAPI.ts
// 📌 Версия: 1.2.0
//
// [CHANGELOG]
// - Убрана попытка загружать подкатегории и товары на главной странице `CatalogBlock`.
// - Добавлено описание вывода только первого уровня категорий.
// - Добавлена обработка отсутствия категорий.

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import type { BotContext } from '@/plugins/TelegramAPI/utils/BotUtils/initializeBots';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

/**
 * Отображение `CatalogBlock`.
 * @param {BotContext} ctx - Контекст Telegram бота.
 * @param {any} block - Блок каталога.
 * @param {Payload} payload - Экземпляр Payload CMS.
 */
export async function renderCatalogBlock(ctx: BotContext, block: any, payload: Payload): Promise<void> {
  try {
    if (!block || !ctx.chat) {
      throw new Error('Некорректный блок или контекст чата.');
    }

    const inlineKeyboard = new InlineKeyboard();

    // Загрузка категорий первого уровня
    const categoriesResult = await payload.find({
      collection: 'product-categories',
      where: { parent_id: { equals: null } }, // Только категории верхнего уровня
      limit: 999,
    });

    const categories = categoriesResult.docs;

    // Если категории отсутствуют
    if (categories.length === 0) {
      await ctx.reply('Категории отсутствуют.');
      log('info', 'Категории для отображения отсутствуют.', payload);
      return;
    }

    // Генерация кнопок для категорий
    categories.forEach((category: any, index: number) => {
      inlineKeyboard.text(category.name, `catalogCategory|${category.id}`);
      if ((index + 1) % 2 === 0) inlineKeyboard.row(); // Новый ряд каждые 2 кнопки
    });

    // Отправка сообщения с обложкой и описанием
    const bannerUrl = block.banner || 'https://kvartiry-tbilisi.ru/images/demo/catalog_banner-1.png';
    const description = block.description || 'Пожалуйста, выберите категорию:';

    await ctx.replyWithPhoto(bannerUrl, {
      caption: description,
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard,
    });

    log('info', `Каталог успешно отображён для пользователя ${ctx.from?.id}`, payload);
  } catch (error: any) {
    log('error', `Ошибка отображения CatalogBlock: ${error.message}`, payload);
    await ctx.reply('Произошла ошибка при загрузке каталога.');
  }
}
