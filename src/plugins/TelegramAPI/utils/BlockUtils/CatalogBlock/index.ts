// 📌 Файл: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/index.ts
// 📌 Версия: 1.0.0
//
// Функция renderCatalogBlock отвечает за рендеринг блока каталога продукции в интерфейсе Telegram-бота.
// Она выполняет запрос к коллекции "product-categories" с учетом настроек блока (например, фильтры по категориям)
// и формирует инлайн-клавиатуру, где каждая кнопка представляет категорию.
// Callback data кнопки имеет формат "catalogCategory|<categoryId>".
// В будущем данную функцию можно расширить, добавив вывод подкатегорий и товаров.

import type { Payload } from 'payload';
import { InlineKeyboard } from 'grammy';
import type { Context, SessionFlavor } from 'grammy';

interface SessionData {
  previousMessages: number[];
}

type BotContext = Context & SessionFlavor<SessionData>;

/**
 * renderCatalogBlock - функция для рендеринга блока каталога.
 *
 * @param ctx - Контекст бота (BotContext), содержащий информацию о сессии и чате.
 * @param blockData - Настройки блока CatalogBlock, заданные в админке (включают alias, locationFilter, categoryFilter и т.д.).
 * @param payload - Экземпляр Payload CMS для выполнения запросов к коллекциям.
 *
 * Логика:
 * 1. Если в настройках блока задан categoryFilter (массив ID категорий), используется он для фильтрации.
 *    Если нет – выбираются только топ-уровневые категории (где parent_id равен null).
 * 2. Выполняется запрос к коллекции "product-categories" с указанным фильтром.
 * 3. Формируется инлайн-клавиатура: каждая кнопка содержит имя категории и callback_data вида "catalogCategory|<categoryId>".
 * 4. Отправляется сообщение с инлайн-клавиатурой для выбора категории.
 */
export async function renderCatalogBlock(
  ctx: BotContext,
  blockData: any,
  payload: Payload
): Promise<void> {
  try {
    // Определяем фильтр для выборки категорий
    let whereClause: any = {};

    if (blockData.categoryFilter && Array.isArray(blockData.categoryFilter) && blockData.categoryFilter.length > 0) {
      // Если задан фильтр по категориям, используем его
      whereClause.id = { in: blockData.categoryFilter };
    } else {
      // Если фильтр не задан, выбираем только топ-уровневые категории (без родительской категории)
      whereClause.parent_id = { equals: null };
    }

    // Выполняем запрос к коллекции "product-categories"
    const categoriesResult = await payload.find({
      collection: 'product-categories',
      where: whereClause,
      sort: 'name',
      limit: 999,
    });
    const categories = categoriesResult.docs;

    // Если категорий не найдено, информируем пользователя
    if (!categories || categories.length === 0) {
      await ctx.reply("No categories found.");
      return;
    }

    // Формируем инлайн-клавиатуру с кнопками для каждой категории
    const keyboard = new InlineKeyboard();
    categories.forEach((category: any, index: number) => {
      // Каждая кнопка отображает имя категории и содержит callback_data "catalogCategory|<categoryId>"
      keyboard.text(category.name, `catalogCategory|${category.id}`);
      // Опционально: после каждых двух кнопок делаем перенос строки
      if ((index + 1) % 2 === 0) {
        keyboard.row();
      }
    });

    // Отправляем сообщение с инлайн-клавиатурой и HTML-разметкой
    await ctx.reply("Please choose a category:", {
      reply_markup: keyboard,
      parse_mode: 'HTML',
    });
  } catch (error: any) {
    console.error("Error rendering catalog block:", error);
    await ctx.reply("An error occurred while loading the catalog.", { parse_mode: 'HTML' });
  }
}
