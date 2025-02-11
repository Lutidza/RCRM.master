// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/CatalogEventHandlers.ts
// Version: 1.2.6
//
// [CHANGELOG]
// - Изменена логика разбора callback‑данных.
// - Для события "catalogCategory" callback‑данные теперь должны быть в формате: "catalogCategory|<categoryId>|<itemsPerPage>".
// - Для события "catalogLoadMore" callback‑данные должны быть: "catalogLoadMore|<categoryId>|<nextPage>|<itemsPerPage>".
// - Обработчик извлекает параметры из callback‑данных и передаёт их в соответствующие функции.
import type { Payload } from 'payload';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import type { BotContext } from '@/plugins/TelegramAPI/utils/BotUtils/initializeBots';
import { renderCategoryItems } from './renderCategoryItems';
import { renderCategoryItemsLoadMore } from './renderCategoryItemsLoadMore';

interface RenderOptions {
  page: number;
  itemsPerPage: number;
  displayMode: 'subcategories' | 'products' | 'all';
}

export async function handleCatalogEvent(
  cbType: string,
  _unused: string, // больше не используется, параметры будут извлечены из callback данных
  _unused2: string | undefined,
  ctx: BotContext,
  payload: Payload,
): Promise<void> {
  try {
    if (!ctx.callbackQuery || !ctx.callbackQuery.data) {
      throw new Error('Данные callback отсутствуют.');
    }
    const parts = (ctx.callbackQuery.data as string).split('|');
    const eventType = parts[0]?.trim() ?? '';
    if (eventType === 'catalogCategory') {
      // Для catalogCategory ожидаем формат: "catalogCategory|<categoryId>|<itemsPerPage>"
      const rawCategoryId = parts[1]?.trim() ?? '';
      const rawItemsPerPage = parts[2]?.trim() ?? "3";
      const itemsPerPage = parseInt(rawItemsPerPage, 10) || 3;
      const categoryId = parseInt(rawCategoryId, 10);
      if (isNaN(categoryId)) {
        log('error', `Некорректный идентификатор категории: "${rawCategoryId}".`, payload);
        await ctx.reply('Ошибка: некорректный идентификатор категории.');
        return;
      }
      const options: RenderOptions = {
        page: 1,
        itemsPerPage,
        displayMode: "all", // здесь можно настроить динамически, если потребуется
      };
      // При переходе в новую категорию очищаем предыдущие сообщения
      await renderCategoryItems(ctx, categoryId.toString(), options, payload, true);
    } else if (eventType === 'catalogLoadMore') {
      // Для catalogLoadMore ожидаем формат: "catalogLoadMore|<categoryId>|<nextPage>|<itemsPerPage>"
      const rawCategoryId = parts[1]?.trim() ?? '';
      const rawPageValue = parts[2]?.trim() ?? "1";
      const rawItemsPerPage = parts[3]?.trim() ?? "3";
      const itemsPerPage = parseInt(rawItemsPerPage, 10) || 3;
      const nextPage = parseInt(rawPageValue, 10);
      const categoryId = parseInt(rawCategoryId, 10);
      if (isNaN(categoryId)) {
        log('error', `Некорректный идентификатор категории: "${rawCategoryId}".`, payload);
        await ctx.reply('Ошибка: некорректный идентификатор категории.');
        return;
      }
      const options: RenderOptions = {
        page: nextPage,
        itemsPerPage,
        displayMode: "all",
      };
      // При постраничной загрузке не очищаем сообщения
      await renderCategoryItemsLoadMore(ctx, categoryId.toString(), payload, nextPage, itemsPerPage);
    } else {
      await ctx.reply('Неизвестный тип события каталога.');
      log('error', `Неизвестный тип события каталога: ${eventType}`, payload);
    }
  } catch (error: any) {
    log('error', `Ошибка обработки события каталога: ${error.message}`, payload);
    await ctx.reply('Произошла ошибка при обработке события.');
  }
}
