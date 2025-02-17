import type { CollectionConfig } from 'payload';
import enabledField from "@/fields/TelegramAPI/enabledFiled/index";

const Statuses: CollectionConfig = {
  slug: 'statuses',
  admin: {
    useAsTitle: 'label',
    group: 'SETTINGS',
  },

  fields: [
    // Unique alias for the status
    {
      name: 'alias',
      type: 'text',
      required: true,
      label: 'Status Alias',
      admin: {
        description: 'A unique alias for the status.',
      },
    },
    // Unique label for the status (displayed in the admin panel)
    {
      name: 'label',
      type: 'text',
      required: true,
      label: 'Status Label',
      admin: {
        description: 'A unique label for the status.',
      },
    },
    // Relationship to the status group
    {
      name: 'statusGroup',
      type: 'relationship',
      relationTo: 'status-groups',
      required: true,
      label: 'Status Group',
      admin: {
        description: 'The group this status belongs to.',
      },
    },
    // Optional description for the status
    {
      name: 'description',
      type: 'textarea',
      required: false,
      label: 'Description',
      admin: {
        description: 'Optional description for the status.',
      },
    },
    // Set as Default: Marks this status as the default for its group (optional)
    {
      name: 'setAsDefault',
      type: 'checkbox',
      required: false,
      label: 'Set as Default',
      defaultValue: false,
      admin: {
        description: 'Mark this status as the default for its status group (optional).',
      },
    },
    enabledField,
  ],
  hooks: {
    beforeValidate: [
      async ({ data, originalDoc, req }) => {
        if (!data || !data.statusGroup) return data;

        //Validate alias uniqueness within the group
        if (data.alias) {
          const existingAlias = await req.payload.find({
            collection: 'statuses',
            where: {
              alias: { equals: data.alias },
              statusGroup: { equals: data.statusGroup },
              id: { not_equals: originalDoc?.id || '' },
            },
          });
          if (existingAlias.docs.length > 0) {
            throw new Error(`A status with the alias "${data.alias}" already exists in this group.`);
          }
        }

        //Validate label uniqueness within the group
        if (data.label) {
          const existingLabel = await req.payload.find({
            collection: 'statuses',
            where: {
              label: { equals: data.label },
              statusGroup: { equals: data.statusGroup },
              id: { not_equals: originalDoc?.id || '' },
            },
          });
          if (existingLabel.docs.length > 0) {
            throw new Error(`A status with the label "${data.label}" already exists in this group.`);
          }
        }

        //Instead of throwing an error if setAsDefault is true and another default exists,
        //unset the default flag on any other status in the same group.
        if (data.setAsDefault) {
          const existingDefaults = await req.payload.find({
            collection: 'statuses',
            where: {
              statusGroup: { equals: data.statusGroup },
              setAsDefault: { equals: true },
              id: { not_equals: originalDoc?.id || '' },
            },
            limit: 999, // ensure you fetch all potential defaults
          });
          // For each status that is currently default, unset its default flag.
          for (const doc of existingDefaults.docs) {
            await req.payload.update({
              collection: 'statuses',
              id: doc.id,
              data: { setAsDefault: false },
            });
          }
        }

        return data;
      },
    ],
  },
};

export default Statuses;
