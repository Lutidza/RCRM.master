// Path: src/plugins/TelegramAPI/utils/BlockUtils/CatalogBlock/paginateCategoryItems.ts
// Version: 1.1.2
//
// [CHANGELOG]
// - Функция теперь возвращает объект с полями docs и totalPages для корректной проверки наличия следующих страниц.
import type { Payload, CollectionSlug } from 'payload';

export async function paginateCategoryItems(
  payload: Payload,
  collection: CollectionSlug,
  where: Record<string, any>,
  page: number,
  itemsPerPage: number,
): Promise<{ docs: any[]; totalPages: number }> {
  try {
    const result = await payload.find({
      collection,
      where,
      limit: itemsPerPage,
      page,
      sort: 'name',
    });
    return {
      docs: result.docs || [],
      totalPages: result.totalPages || Math.ceil((result.totalDocs || 0) / itemsPerPage),
    };
  } catch (error: any) {
    console.error(`Ошибка при пагинации коллекции "${collection}":`, error);
    throw new Error(`Ошибка при загрузке данных из коллекции "${collection}".`);
  }
}

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
