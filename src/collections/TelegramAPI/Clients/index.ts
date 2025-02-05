// Path: src/collections/TelegramAPI/Clients/index.ts
// Version: 3.3.1
//
// The Clients collection stores information about Telegram users associated with bots.
// The relationship is implemented via the "bots" field, which references the Bots collection.
// A client can be associated with multiple bots.
// In the admin panel, the client's title is displayed using the computed "display_name" field,
// which is derived from the "user_name" (prefixed with '@').
// The default columns in the admin list view are displayed in the following order:
//   Display Name, Client Status, Telegram ID (number), Associated Bots, Total Visits, Last Visit Date, Created At.
// The "status" field is now a relationship field referencing dynamic statuses from the "statuses" collection.
// NOTE: The "status" field is no longer required in API operations (status assignment will be configured manually in the admin panel).

import type { CollectionConfig } from 'payload';

const Clients: CollectionConfig = {
  slug: 'clients',

  admin: {
    useAsTitle: 'display_name',
    group: 'CLIENTS MANAGEMENT',
    defaultColumns: [
      'display_name',
      'status',
      'telegram_id',
      'bots',
      'total_visit',
      'last_visit',
      'createdAt',
    ],
  },
  fields: [
    // Telegram User ID (number)
    {
      name: 'telegram_id',
      type: 'number',
      required: true,
      label: 'Telegram ID (number)',
    },
    // Relationship to Bots: array (hasMany: true)
    {
      name: 'bots',
      type: 'relationship',
      relationTo: 'bots',
      hasMany: true,
      required: true,
      label: 'Associated Bots',
      admin: {
        description: 'Select bots from the Bots collection associated with this client.',
      },
    },
    // First Name
    {
      name: 'first_name',
      type: 'text',
      label: 'First Name',
    },
    // Last Name
    {
      name: 'last_name',
      type: 'text',
      label: 'Last Name',
    },
    // Username
    {
      name: 'user_name',
      type: 'text',
      label: 'Username',
    },
    // Display Name (computed from user_name)
    {
      name: 'display_name',
      type: 'text',
      label: 'Display Name',
      admin: {
        readOnly: true,
        description: 'Automatically computed display name in the format "@" + username.',
      },
    },
    // Client Status (dynamic status from the "statuses" collection)
    // Changed required: true to false, as the status will be configured via the admin panel.
    {
      name: 'status',
      type: 'relationship',
      relationTo: ['statuses'],
      required: true,

      filterOptions: async ({ req }) => {
        // Fetch active status groups linked to Clients
        const activeGroups = await req.payload.find({
          collection: 'status-groups',
          where: {
            linkedCollections: { contains: 'clients' },
          },
        });

        const groupIds = activeGroups.docs.map((group) => group.id);

        if (!groupIds.length) return false; // If no active groups, disable the field

        // Fetch active statuses within the groups
        return {
          statusGroup: { in: groupIds },

        };
      },


      label: 'Client Status',
      admin: {
        description: 'Select the client status from dynamic statuses.',
        position: 'sidebar',
      },
    },
    // Last Visit Date (displayed in sidebar)
    {
      name: 'last_visit',
      type: 'date',
      label: 'Last Visit Date',
      admin: {
        position: 'sidebar',
      },
    },
    // Total Visits (displayed in sidebar)
    {
      name: 'total_visit',
      type: 'number',
      defaultValue: 0,
      required: true,
      label: 'Total Visits',
      admin: {
        description:
            'The total number of visits by this client. Set to 1 on the first visit and incremented on subsequent visits.',
        position: 'sidebar',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (!data) return data;
        // Compute display_name based on the following logic:
        // - If user_name exists, display_name = "@" + user_name (if not already prefixed).
        // - Otherwise, if first_name exists:
        //     - If last_name exists, display_name = first_name + " " + last_name.
        //     - Else, display_name = first_name.
        // - Otherwise, display_name = "Unnamed".
        if (data.user_name) {
          data.display_name = data.user_name.startsWith('@')
              ? data.user_name
              : `@${data.user_name}`;
        } else if (data.first_name) {
          data.display_name = data.last_name
              ? `${data.first_name} ${data.last_name}`
              : data.first_name;
        } else {
          data.display_name = 'Unnamed';
        }
        return data;
      },
    ],
  },
};

export default Clients;
