// 📌 Файл: src/collections/TelegramAPI/Products/Discounts/index.ts
// 📌 Версия: 1.0.0

import type { CollectionConfig } from 'payload';

export const Discounts: CollectionConfig = {
  slug: 'discounts',
  labels: {
    singular: 'Discount',
    plural: 'Discounts'
  },
  admin: {
    useAsTitle: 'discount_name',
    group: 'PRODUCTS',
  },
  fields: [
    {
      name: 'discount_name',
      type: 'text',
      label: 'Discount Name',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
    {
      name: 'discount_percentage',
      type: 'number',
      required: true,
      label: 'Discount Percentage',
      min: 0,
      max: 100,
    },
    {
      name: 'discount_fixed_amount',
      type: 'number',
      label: 'Fixed Discount Amount',
      required: false,
    },
    {
      name: 'start_date',
      type: 'date',
      required: true,
      label: 'Start Date',
    },
    {
      name: 'end_date',
      type: 'date',
      required: true,
      label: 'End Date',
    },
    {
      name: 'applies_to_products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Applicable Products',
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }
      ],
      required: true,
      defaultValue: 'active',
      label: 'Status',
      admin: {
        position: 'sidebar',
      },
    }
  ]
};
