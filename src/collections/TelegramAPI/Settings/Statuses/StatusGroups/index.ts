// Path: src/collections/TelegramAPI/Settings/Statuses/StatusGroups/index.ts
// Version: 1.0.1
//
// The StatusGroups collection stores groups for dynamic statuses. Each group can have multiple statuses.
// A group may optionally have a default status; however, instead of storing a "defaultStatus" field here,
// each status in the "statuses" collection can be marked as default with the "setAsDefault" field.
// This collection also includes settings for linked collections where the statuses apply.

import type { CollectionConfig } from 'payload';

const StatusGroups: CollectionConfig = {
  slug: 'status-groups',
  admin: {
    useAsTitle: 'name',
    group: 'SETTINGS',
    defaultColumns: ['name', 'alias', 'isActive'],
  },
  fields: [
    // Group Name (displayed in the admin panel)
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Group Name',
      admin: {
        description: 'The name of the status group displayed in the admin panel.',
      },
    },
    // Group Alias (unique identifier for internal use)
    {
      name: 'alias',
      type: 'text',
      required: true,
      unique: true,
      label: 'Group Alias',
      admin: {
        description: 'A unique alias for the status group used internally.',
      },
    },
    // Activity status for the group
    {
      name: 'isActive',
      type: 'select',
      required: true,
      defaultValue: 'enabled',
      options: [
        { label: 'Enabled', value: 'enabled' },
        { label: 'Disabled', value: 'disabled' },
      ],
      label: 'Activity Status',
      admin: {
        description: 'Specify whether this status group is active or not.',
        position: 'sidebar',
      },
    },
    // Linked Collections: where this status group is applicable
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
        { label: 'Cities', value: 'cities' },
        { label: 'Districts', value: 'districts' },
      ],
      admin: {
        description: 'Collections where this status group is applicable.',
        position: 'sidebar',
      },
    },
    // Note: The default status for a group is not stored here.
    // Instead, in the Statuses collection, each status can be marked as default via the "setAsDefault" field.
    {
      name: 'linkedStatuses',
      type: 'join',
      collection: 'statuses',
      on: 'statusGroup',
      hasMany: true,
      label: 'Linked Statuses',
      admin: {
        defaultColumns: ['label', 'alias'],
        allowCreate: true,
      },
    },
    // Optional description for the group
    {
      name: 'description',
      type: 'textarea',
      required: false,
      label: 'Description',
      admin: {
        description: 'Additional information about the status group.',
      },
    },
  ],
};

export default StatusGroups;
