// 📌 Файл: src/collections/TelegramAPI/Settings/Labels/Labels/index.TelegramAPI.ts
// 📌 Версия: 1.0.1

import type { CollectionConfig } from 'payload';
import enabledField from "@/fields/TelegramAPI/enabledFiled";

const Labels: CollectionConfig = {
  slug: 'labels',
  admin: {
    useAsTitle: 'label',
    group: 'SETTINGS',
  },
  fields: [
    {
      name: 'alias',
      type: 'text',
      required: true,
      label: 'Label Alias',
      admin: {
        description: 'A unique alias for the label.',
      },
    },
    {
      name: 'label',
      type: 'text',
      required: true,
      label: 'Label Name',
      admin: {
        description: 'A unique name for the label.',
      },
    },
    {
      name: 'labelGroup',
      type: 'relationship',
      relationTo: 'label-groups',
      required: true,
      label: 'Label Group',
      admin: {
        description: 'The group this label belongs to.',
      },
      filterOptions: async ({ req }) => {
        const activeGroups = await req.payload.find({
          collection: 'label-groups',
          where: {
            enabled: { equals: 'enabled' },
          },
        });
        if (!activeGroups.docs.length) return false;
        return {
          id: {
            in: activeGroups.docs.map((group: any) => group.id),
          },
        };
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
      label: 'Description',
      admin: {
        description: 'Optional description for the label.',
      },
    },
    {
      name: 'setAsDefault',
      type: 'checkbox',
      required: false,
      label: 'Set as Default',
      admin: {
        description: 'Mark this label as the default for its label group (optional).',
      },
    },
    enabledField,
  ],
  hooks: {
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        if (!data || !data.labelGroup) return data;

        if (data.alias) {
          const existingAlias = await req.payload.find({
            collection: 'labels',
            where: {
              alias: { equals: data.alias },
              labelGroup: { equals: data.labelGroup },
              id: { not_equals: originalDoc?.id || '' },
            },
          });
          if (existingAlias.docs.length > 0) {
            throw new Error(`A label with the alias "${data.alias}" already exists in this group.`);
          }
        }

        if (data.label) {
          const existingLabel = await req.payload.find({
            collection: 'labels',
            where: {
              label: { equals: data.label },
              labelGroup: { equals: data.labelGroup },
              id: { not_equals: originalDoc?.id || '' },
            },
          });
          if (existingLabel.docs.length > 0) {
            throw new Error(`A label with the name "${data.label}" already exists in this group.`);
          }
        }
        return data;
      },
    ],
  },
};

export default Labels;
