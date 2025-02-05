// Path: src/fields/TelegramAPI/getStatusField/index.ts
// Version: 1.6.1
//
// The status field configuration for the "clients" collection.
// This field links to the "statuses" collection and filters available statuses based on active status groups.
// The default status is now assigned in processClient.ts (for Telegram API) and in the admin panel via defaultValue.

import type { Field } from 'payload';

/**
 * Fetches status groups linked to the given collection.
 */
const getLinkedStatusGroups = async (req: any, collectionSlug: string) => {
  const { docs } = await req.payload.find({
    collection: 'status-groups',
    where: { linkedCollections: { contains: collectionSlug } },
    depth: 0,
  });

  return docs.map((group: any) => group.id);
};

/**
 * Retrieves the default status (`setAsDefault=true`) from the linked status groups.
 */
const getDefaultStatus = async (req: any, collectionSlug: string) => {
  const groupIds = await getLinkedStatusGroups(req, collectionSlug);
  if (!groupIds.length) return null;

  const { docs } = await req.payload.find({
    collection: 'statuses',
    where: {
      statusGroup: { in: groupIds },
      setAsDefault: { equals: true },
      enabled: { equals: 'enabled' },
    },
    limit: 1,
    depth: 0,
  });

  return docs[0]?.id || null;
};

export const getStatusField = (collectionSlug: string): Field => ({
  name: 'status',
  type: 'relationship',
  relationTo: 'statuses',
  required: false,
  admin: {
    description:
      'Select a status from the available options. If none is selected, the default status will be automatically assigned.',
    position: 'sidebar',
  },
  filterOptions: async ({ req }) => {
    const groupIds = await getLinkedStatusGroups(req, collectionSlug);
    return groupIds.length ? { statusGroup: { in: groupIds }, enabled: { equals: 'enabled' } } : false;
  },
  defaultValue: async ({ req }) => await getDefaultStatus(req, collectionSlug) ?? undefined,
});
