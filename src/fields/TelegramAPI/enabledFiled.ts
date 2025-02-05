//src/fields/TelegramAPI/enabledFiled.ts
//The Enabled/Disabled field is the document's activity status. It is used in most collections as a standard.
import type { Field } from 'payload';

export const enabledField: Field = {
  name: 'enabled',
  type: 'select',
  required: true,
  options: [
    { label: 'Enabled', value: 'enabled' },
    { label: 'Disabled', value: 'disabled' },
  ],
  defaultValue: 'enabled',
  label: 'Activity Status',
  admin: {
    description: 'Specify whether this status is active or not.',
    position: 'sidebar',
  },
};
