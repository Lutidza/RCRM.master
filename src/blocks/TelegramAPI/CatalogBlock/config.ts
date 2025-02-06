// 📌 Файл: src/blocks/TelegramAPI/CatalogBlock/config.ts
// 📌 Версия: 1.0.0
//
// CatalogBlock – этот блок используется для вывода каталога продукции в интерфейсе Telegram-бота.
// Он позволяет динамически отображать иерархическую структуру, включающую категории, подкатегории и товары,
// а также обеспечивает фильтрацию товаров по выбранной локации. Этот блок используется внутри LayoutBlock.

import type { Block } from 'payload';

const CatalogBlock: Block = {
  slug: 'catalog-blocks',
  interfaceName: 'CatalogBlock',
  labels: {
    singular: 'Catalog Block',
    plural: 'Catalog Blocks',
  },
  fields: [
    // Скрытое поле для идентификации типа блока
    {
      name: 'blockType',
      type: 'text',
      defaultValue: 'CatalogBlock',
      admin: { hidden: true },
    },
    // Название блока каталога (информационное для администратора)
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Catalog Block Name',
      admin: {
        description: 'Введите название блока каталога для отображения в админке (например, "Product Catalog").',
      },
    },
    // Alias блока каталога – уникальный идентификатор для вызова блока в боте
    {
      name: 'alias',
      type: 'text',
      required: true,
      label: 'Catalog Block Alias',
      admin: {
        description: 'Введите уникальный alias для вызова блока каталога (например, "product_catalog").',
      },
    },
    // Опциональное поле для фильтрации по локации. Позволяет выбрать одну локацию из коллекции "locations"
    {
      name: 'locationFilter',
      type: 'relationship',
      relationTo: 'locations',
      required: false,
      label: 'Location Filter',
      admin: {
        description: 'Опционально выберите локацию для фильтрации каталога (одна локация).',
      },
    },
    // Опциональное поле для фильтрации по категориям продукции. Позволяет выбрать одну или несколько категорий
    // из коллекции "product-categories". Если не задано, выводятся все категории.
    {
      name: 'categoryFilter',
      type: 'relationship',
      relationTo: 'product-categories',
      hasMany: true,
      required: false,
      label: 'Category Filter',
      admin: {
        description: 'Опционально выберите одну или несколько категорий для отображения. Если не задано, выводятся все категории.',
      },
    },
    // Флаг очистки предыдущих сообщений перед выводом каталога
    {
      name: 'clearPreviousMessages',
      type: 'checkbox',
      defaultValue: false,
      label: 'Clear Previous Messages',
      admin: {
        description: 'Если включено, перед выводом каталога будут удалены все предыдущие сообщения пользователя.',
      },
    },
  ],
};

export default CatalogBlock;
