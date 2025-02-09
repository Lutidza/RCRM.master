// 📌 File: src/blocks/TelegramAPI/CatalogBlock/config.ts
// 📌 Version: 1.0.5
//
// [CHANGELOG]
// - Добавлено поле description для вывода текста каталога в Telegram.
// - Добавлено поле displayMode с вариантами "subcategories", "products", "all" для выбора режима отображения каталога.
// - Остальные настройки сохранены.

import type { Block } from 'payload';

const CatalogBlock: Block = {
  slug: 'catalog-blocks',
  interfaceName: 'CatalogBlock',
  labels: {
    singular: 'Catalog Block',
    plural: 'Catalog Blocks',
  },
  fields: [
    {
      name: 'blockType',
      type: 'text',
      defaultValue: 'CatalogBlock',
      admin: { hidden: true },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Catalog Block Name',
      admin: {
        description:
          'Введите название блока каталога для отображения в админке (например, "Product Catalog").',
      },
    },
    {
      name: 'alias',
      type: 'text',
      required: true,
      label: 'Catalog Block Alias',
      admin: {
        description:
          'Введите уникальный alias для вызова блока каталога (например, "product_catalog").',
      },
    },
    // Новое поле для вывода описания в Telegram
    {
      name: 'description',
      type: 'textarea',
      required: false,
      label: 'Catalog Block Description',
      admin: {
        description: 'Введите описание каталога, которое будет отображаться в Telegram вместо фиксированного текста.',
      },
    },
    // Новое поле для выбора режима отображения каталога
    {
      name: 'displayMode',
      type: 'select',
      required: false,
      label: 'Display Mode',
      options: [
        { label: 'Subcategories Only', value: 'subcategories' },
        { label: 'Products Only', value: 'products' },
        { label: 'All (Subcategories and Products)', value: 'all' },
      ],
      defaultValue: 'subcategories',
      admin: {
        description: 'Выберите режим отображения каталога: только подкатегории, только товары, или все сразу.',
      },
    },
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
    {
      name: 'categoryFilter',
      type: 'relationship',
      relationTo: 'product-categories',
      hasMany: true,
      required: false,
      label: 'Category Filter',
      admin: {
        description:
          'Опционально выберите одну или несколько категорий для отображения. Если не задано, выводятся все категории.',
      },
    },
    {
      name: 'clearPreviousMessages',
      type: 'checkbox',
      defaultValue: false,
      label: 'Clear Previous Messages',
      admin: {
        description: 'Если включено, перед выводом каталога будут удалены все предыдущие сообщения пользователя.',
      },
    },
    {
      name: 'itemsPerPage',
      type: 'number',
      required: false,
      label: 'Items Per Page',
      defaultValue: 3,
      admin: {
        description: 'Число товаров на одной странице. По умолчанию 3.',
      },
    },
  ],
};

export default CatalogBlock;
