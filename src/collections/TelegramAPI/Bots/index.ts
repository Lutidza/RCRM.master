// Path: src/collections/TelegramAPI/Bots/index.ts
// Version: 3.1.5
//
// The Bots collection stores each bot's settings: its name, token, description (for updating the Telegram bot),
// a select field for enabling/disabling the bot, initialization status, and interface settings.
// The "interface" group contains blocks (using the "blocks" field type) and default layout aliases.
// The relationship with the Clients collection is established via the standard auto-increment numeric id.
//
// This version uses a Tabs Field to separate settings into two tabs in the admin panel:
// • "Bot Config" – contains basic bot settings, with the fields "Enabled", "Initialization Status" and
//   "Last Initialization Date" displayed in the sidebar.
// • "Bot Interface" – contains interface settings (blocks and default layout aliases), with the default layout
//   fields displayed in the sidebar.

import MessageBlock from '@/blocks/TelegramAPI/MessageBlock/config';
import ButtonBlock from '@/blocks/TelegramAPI/ButtonBlock/config';
import LayoutBlock from '@/blocks/TelegramAPI/LayoutBlock/config';
import CommandBlock from '@/blocks/TelegramAPI/CommandBlock/config';

import type { CollectionConfig } from 'payload';

const Bots: CollectionConfig = {
  slug: 'bots',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Bot Config',
          description: 'Basic bot settings.',
          fields: [
            // Bot Name
            {
              name: 'name',
              label: 'Bot Name',
              type: 'text',
              required: true,
            },
            // Telegram Bot Token
            {
              name: 'token',
              label: 'Telegram Bot Token',
              type: 'text',
              required: true,
            },
            // Bot Description (textarea)
            {
              name: 'description',
              type: 'textarea',
              required: false,
              admin: {
                description:
                  'Enter the bot description (e.g., "CRM Connector Bot for order management").',
              },
            },

          ],
        },
        {
          label: 'Bot Interface',
          description:
            'Interface settings: add blocks (Message, Button, Layout, Command) and specify default layout aliases.',
          fields: [
            {
              name: 'interface',
              type: 'group',
              label: 'Bot Interface Settings',
              fields: [
                {
                  name: 'blocks',
                  type: 'blocks',
                  blocks: [
                    MessageBlock,
                    ButtonBlock,
                    LayoutBlock,
                    CommandBlock,
                  ],
                },
                {
                  name: 'defaultStartLayout',
                  type: 'text',
                  defaultValue: 'start',
                  required: true,
                  label: 'Default Start Layout (Alias)',
                  admin: {
                    description:
                      'Alias for the layout used for returning users. Example: "start".',
                    position: 'sidebar',
                  },
                },
                {
                  name: 'defaultFirstVisitLayout',
                  type: 'text',
                  defaultValue: 'start_first_visit',
                  required: true,
                  label: 'Default First Visit Layout (Alias)',
                  admin: {
                    description:
                      'Alias for the layout used for new users. Example: "start_first_visit".',
                    position: 'sidebar',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    // Enabled field as select with two options; moved to sidebar.
    {
      name: 'enabled',
      type: 'select',
      label: 'Enabled',
      options: [
        { label: 'Enabled', value: 'enabled' },
        { label: 'Disabled', value: 'disabled' },
      ],
      defaultValue: 'enabled',
      required: true,
      admin: {
        position: 'sidebar',
        description: 'Select whether the bot is enabled or disabled.',
      },
    },
    // Initialization Status field; moved to sidebar.
    {
      name: 'initialization_status',
      type: 'select',
      label: 'Initialization Status',
      options: [
        { label: 'Not Initialized', value: 'Not Initialized' },
        { label: 'Initialized', value: 'Initialized' },
        { label: 'Error', value: 'Error' },
      ],
      defaultValue: 'Not Initialized',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    // Last Initialization Date field; moved to sidebar.
    {
      name: 'last_initialized',
      type: 'date',
      required: false,
      label: 'Last Initialization Date',
      admin: {
        position: 'sidebar',
      },
    },
  ],
};

export default Bots;
