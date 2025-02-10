// 📌 Файл: src/collections/TelegramAPI/Settings/Labels/LabelsGroups/index.TelegramAPI.ts
// 📌 Версия: 1.0.1

import type { CollectionConfig } from 'payload';
import enabledField from "@/fields/TelegramAPI/enabledFiled";

const LabelGroups: CollectionConfig = {
  slug: 'label-groups',
  admin: {
    useAsTitle: 'name',
    group: 'SETTINGS',
    defaultColumns: ['name', 'alias', 'enabled'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Group Name',
      admin: {
        description: 'The name of the label group displayed in the admin panel.',
      },
    },
    {
      name: 'alias',
      type: 'text',
      required: true,
      unique: true,
      label: 'Group Alias',
      admin: {
        description: 'A unique alias for the label group used internally.',
      },
    },
    {
      name: 'linkedCollections',
      type: 'select',
      hasMany: true,
      label: 'Linked Collections',
      options: [
        { label: 'Products', value: 'products' },
        { label: 'Offers', value: 'offers' },
        { label: 'Orders', value: 'orders' },
        { label: 'Clients', value: 'clients' },
        { label: 'Bots', value: 'bots' },
        { label: 'Discounts', value: 'discounts' },
      ],
      admin: {
        description: 'Collections where this label group is applicable.',
        position: 'sidebar',
      },
    },
    {
      name: 'linkedLabels',
      type: 'join',
      collection: 'labels',
      on: 'labelGroup',
      hasMany: true,
      label: 'Linked Labels',
      admin: {
        defaultColumns: ['label', 'alias'],
        allowCreate: true,
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
      label: 'Description',
      admin: {
        description: 'Additional information about the label group.',
      },
    },
    enabledField,
  ],
};

export default LabelGroups;
