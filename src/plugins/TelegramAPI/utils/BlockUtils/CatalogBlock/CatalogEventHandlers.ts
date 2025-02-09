// 📌 Путь: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/CatalogEventHandlers.ts
// 📌 Версия: 1.2.0
//
// [CHANGELOG]
// - Убрана избыточная логика из обработчика catalogCategory.
// - Добавлен вызов renderCategoryItems для обработки события catalogCategory.
// - Логика кнопки "Загрузить ещё" делегирована в renderCategoryItems.

import type { Payload } from 'payload';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import type { BotContext } from '@/plugins/TelegramAPI/utils/BotUtils/initializeBots';
import { renderCategoryItems } from '@/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/renderCategoryItems';

/**
 * Обработчик событий каталога.
 * @param {string} cbType - Тип callback-события.
 * @param {string} rawCategoryId - Идентификатор категории.
 * @param {string} rawItemsPerPage - Количество элементов на страницу.
 * @param {BotContext} ctx - Контекст Telegram бота.
 * @param {Payload} payload - Экземпляр Payload CMS.
 */
export async function handleCatalogEvent(
  cbType: string,
  rawCategoryId: string,
  rawItemsPerPage: string,
  ctx: BotContext,
  payload: Payload,
): Promise<void> {
  try {
    if (!ctx.callbackQuery || !ctx.callbackQuery.data) {
      throw new Error('Данные callback отсутствуют.');
    }

    // Парсинг данных callback
    const categoryId = parseInt(rawCategoryId, 10);
    const itemsPerPage = parseInt(rawItemsPerPage, 10) || 3; // Устанавливаем значение по умолчанию
    if (isNaN(categoryId)) {
      log('error', `Некорректный идентификатор категории: "${rawCategoryId}".`, payload);
      await ctx.reply('Ошибка: некорректный идентификатор категории.');
      return;
    }

    switch (cbType) {
      case 'catalogCategory': {
        // Вызов функции отображения подкатегорий и товаров
        await renderCategoryItems(ctx, categoryId.toString(), { page: 1, itemsPerPage }, payload);
        break;
      }

      default:
        await ctx.reply('Неизвестный тип события каталога.');
        log('error', `Неизвестный тип события каталога: ${cbType}`, payload);
    }
  } catch (error: any) {
    log('error', `Ошибка обработки события каталога: ${error.message}`, payload);
    await ctx.reply('Произошла ошибка при обработке события.');
  }
}
