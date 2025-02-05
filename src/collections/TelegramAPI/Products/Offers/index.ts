// 📌 Файл: src/collections/TelegramAPI/Products/Offers/index.ts
// 📌 Версия: 1.9.4

import type { CollectionConfig } from 'payload';

export const Offers: CollectionConfig = {
  slug: 'offers',
  labels: {
    singular: 'Offer',
    plural: 'Offers'
  },
  admin: {
    useAsTitle: 'name',
    group: 'PRODUCTS',
  },
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
      hasMany: true,
      label: 'Offer Media',
    },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations',
      required: true,
      label: 'Location',
    },
    {
      name: 'latitude',
      type: 'text',
      required: true,
      label: 'Latitude',
    },
    {
      name: 'longitude',
      type: 'text',
      required: true,
      label: 'Longitude',
    },
    {
      name: 'name',
      type: 'text',
      label: 'Offer Name',
      required: false,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Offer Description',
      required: false,
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      label: 'Related Product',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      required: false,
      label: 'Client',
      filterOptions: () => ({
        'status.alias': { not_equals: 'executor' }
      }),
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'executor',
      type: 'relationship',
      relationTo: 'clients',
      label: 'Executor',
      filterOptions: () => ({
        'status.alias': { equals: 'executor' }
      }),
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'relationship',
      relationTo: 'statuses',
      required: false,
      label: 'Status',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'enabled',
      type: 'select',
      options: [
        { label: 'Enabled', value: 'enabled' },
        { label: 'Disabled', value: 'disabled' }
      ],
      required: true,
      defaultValue: 'enabled',
      label: 'Enabled',
      admin: {
        position: 'sidebar',
      },
    },
  ],
};
