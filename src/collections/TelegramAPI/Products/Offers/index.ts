// 📌 Файл: src/collections/TelegramAPI/Products/Offers/index.ts
// 📌 Версия: 1.9.4

import type { CollectionConfig } from 'payload';
import enabledField from "@/fields/TelegramAPI/enabledFiled";
import { getStatusField } from "@/fields/TelegramAPI/getStatusField";

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
        and: [
          {'status.alias': {not_equals: 'executor'}},
          {'status.alias': {not_equals: 'banned'}},
        ],

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
        and: [
          {'status.alias': {equals: 'executor'}},
          {'status.alias': {not_equals: 'banned'}},
        ],
      }),
      admin: {
        position: 'sidebar',
      },
    },
    enabledField,
    getStatusField('offers'), // Pass the current collection's slug explicitly.

  ],
};
