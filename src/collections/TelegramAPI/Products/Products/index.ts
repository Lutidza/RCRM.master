// 📌 Файл: src/collections/TelegramAPI/Products/index.TelegramAPI.ts
// 📌 Версия: 2.2.0

import type { CollectionConfig } from 'payload';
import  ThumbnailCell  from "@/components/AdminUI/ThumbnailCell";
import enabledField from "@/fields/TelegramAPI/enabledFiled";
import { getStatusField } from "@/fields/TelegramAPI/getStatusField";

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Product',
    plural: 'Products',
  },
  admin: {
    useAsTitle: 'name',
    group: 'PRODUCTS',
    defaultColumns: ['name', 'images', 'size', 'price', 'offers_quantity', 'enabled'],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Product Name',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Product Description',
      required: false,
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      displayPreview: true,
      label: 'Product Images',
      hasMany: true,
      required: false,
    },
    {
      name: 'size',
      type: 'number',
      label: 'Size',
      required: true,
    },
    {
      name: 'deal_type',
      type: 'select',
      options: [
        { label: 'In stock', value: 'in_stock' },
        { label: 'Pre-order', value: 'pre_order' },
      ],
      required: true,
      defaultValue: 'in_stock',
      label: 'Deal Type',
    },
    {
      name: 'price',
      type: 'number',
      label: 'Price',
      required: true,
    },
    {
      name: 'discount',
      type: 'relationship',
      relationTo: 'discounts',
      label: 'Discount',
      required: false,
    },
    {
      name: 'category_ids',
      type: 'relationship',
      relationTo: 'product-categories',
      hasMany: true,
      label: 'Categories',
      required: true,
    },
    {
      name: 'labels_ids',
      type: 'relationship',
      relationTo: 'labels',
      hasMany: true,
      label: 'Labels',
      required: false,
    },
    {
      name: 'offers',
      type: 'join',
      collection: 'offers',
      on: 'product',
      label: 'Related Offers',
      where: { enabled: { equals: 'enabled'} },
      admin: {
        defaultColumns: ['name', 'location', 'status', 'updated_at'],
      },
    },
    enabledField,
    getStatusField('products'), // Pass the current collection's slug explicitly.
    {
      name: 'offers_quantity',
      type: 'number',
      label: 'Offers Quantity',
      required: true,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'locations_ids',
      type: 'relationship',
      relationTo: 'locations',
      hasMany: true,
      label: 'Locations',
      required: false,
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      label: 'Owner',
      required: false,
    },
    {
      name: 'orders_count',
      type: 'number',
      label: 'Orders Count',
      required: false,
      admin: {
        position: 'sidebar',

      },
    },
  ],
  hooks: {
    beforeRead: [
      //Calculating the number of linked Offers. Updating the offers_quantity field in the collection
      async ({ doc }) => {
        doc.offers_quantity =  doc.offers?.docs?.length || 0;
        return doc;
      },

      async ({doc}) => {
       console.log(doc.images)
      }
    ],
    afterRefresh:
      [
        async ({ req  }) => {

          console.log('Product operation:', req);
        }

    ],
  }
};
