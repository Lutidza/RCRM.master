// 📌 Файл: src/collections/TelegramAPI/Locations/index.ts
// 📌 Версия: 1.1.1

import type { CollectionConfig } from 'payload';

export const Locations: CollectionConfig = {
  slug: 'locations',
  labels: {
    singular: 'Location',
    plural: 'Locations'
  },
  admin: {
    useAsTitle: 'name',
    group: 'LOCATIONS',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Location Name',
      required: true,
    },
    {
      name: 'alias',
      type: 'text',
      required: true,
      unique: true,
      label: 'Location Alias',
    },
    {
      name: 'parent_id',
      type: 'relationship',
      relationTo: 'locations',
      label: 'Parent Location',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
    {
      name: 'Enabled',
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
    {
      name: 'linked_bots',
      type: 'relationship',
      relationTo: 'bots',
      hasMany: true,
      label: 'Linked Bots',
      admin: {
        position: 'sidebar',
      },
    }
  ]
};
