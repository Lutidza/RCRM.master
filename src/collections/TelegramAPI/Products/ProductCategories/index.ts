// 📌 Файл: src/collections/TelegramAPI/Products/ProductCategories/index.ts
// 📌 Версия: 1.1.0

import type { CollectionConfig } from 'payload';
import enabledField from "@/fields/TelegramAPI/enabledFiled";

export const ProductCategories: CollectionConfig = {
  slug: 'product-categories',
  labels: {
    singular: 'Product Category',
    plural: 'Product Categories'
  },
  admin: {
    useAsTitle: 'name',
    group: 'PRODUCTS',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Category Name',
      required: true,
    },
    {
      name: 'alias',
      type: 'text',
      required: true,
      unique: true,
      label: 'Category Alias',
    },
    {
      name: 'parent_id',
      type: 'relationship',
      relationTo: 'product-categories',
      label: 'Parent Category',
      admin: {
        position: 'sidebar',
      },
      filterOptions: async ({ data }) => {
        // If editing an existing document (data contains an id), exclude the document itself
        if (data && data.id) {
          return { id: { not_equals: data.id } };
        }
        // For new documents, return true to apply no filtering.
        return true;
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      label: 'Category Image',
    },
    {
      name: 'linked_bots',
      type: 'relationship',
      relationTo: 'bots',
      hasMany: true,
      label: 'Linked Bots',
      admin: {
        position: 'sidebar',
      },
    },
    enabledField,
  ]
};
