// 📌 Путь: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/paginateCategoryItems.ts
// 📌 Версия: 1.1.1

import type { Payload, CollectionSlug } from 'payload';

/**
 * Функция для пагинации данных из коллекции.
 * @param {Payload} payload - Экземпляр Payload CMS.
 * @param {CollectionSlug} collection - Название коллекции (определённое в Payload CMS).
 * @param {Record<string, any>} where - Условие фильтрации для запроса.
 * @param {number} page - Номер страницы.
 * @param {number} itemsPerPage - Количество элементов на странице.
 * @returns {Promise<any[]>} - Результаты пагинации.
 */
export async function paginateCategoryItems(
  payload: Payload,
  collection: CollectionSlug, // ✅ Тип коллекции из Payload CMS
  where: Record<string, any>,
  page: number,
  itemsPerPage: number,
): Promise<any[]> {
  try {
    const result = await payload.find({
      collection,
      where,
      limit: itemsPerPage,
      page,
      sort: 'name',
    });

    return result.docs || [];
  } catch (error: any) {
    console.error(`Ошибка при пагинации коллекции "${collection}":`, error);
    throw new Error(`Ошибка при загрузке данных из коллекции "${collection}".`);
  }
}

/**
 * Функция для формирования данных пагинации.
 * @param {number} currentPage - Текущая страница.
 * @param {number} totalItems - Общее количество элементов.
 * @param {number} itemsPerPage - Количество элементов на одной странице.
 * @returns {object} - Данные пагинации, включая информацию о страницах.
 */
export function generatePaginationData(
  currentPage: number,
  totalItems: number,
  itemsPerPage: number,
): {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
} {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  return {
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}
