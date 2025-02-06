// 📌 Файл: src/collections/TelegramAPI/Locations/index.ts
// 📌 Версия: 1.1.1

import type { CollectionConfig } from 'payload';
import enabledField from "@/fields/TelegramAPI/enabledFiled";

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
