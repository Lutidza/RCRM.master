// Path: src/fields/TelegramAPI/getStatusField/index.ts
// Version: 1.6.2-with-logs
//
// Добавляем console.log для диагностики:
// - в getLinkedStatusGroups
// - в filterOptions
// - в defaultValue

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

  console.log(`[DEBUG getLinkedStatusGroups] collectionSlug="${collectionSlug}", found groups:`, docs.map((g: any) => g.id));

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

  const defaultStatusId = docs[0]?.id || null;
  console.log(`[DEBUG getDefaultStatus] collectionSlug="${collectionSlug}", defaultStatusId=`, defaultStatusId);

  return defaultStatusId;
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
    console.log(`[DEBUG getStatusField: filterOptions] collectionSlug="${collectionSlug}", groupIds=`, groupIds);

    if (!groupIds.length) {
      console.log(`[DEBUG getStatusField: filterOptions] groupIds is empty => returning false => no statuses will be shown for collection="${collectionSlug}".`);
      return false;
    }

    // Показывать статусы, у которых statusGroup в groupIds и enabled = 'enabled'
    const where = { statusGroup: { in: groupIds }, enabled: { equals: 'enabled' } };
    console.log(`[DEBUG getStatusField: filterOptions] final where=`, JSON.stringify(where, null, 2));
    return where;
  },
  defaultValue: async ({ req }) => {
    const defaultStatus = await getDefaultStatus(req, collectionSlug);
    console.log(`[DEBUG getStatusField: defaultValue] collectionSlug="${collectionSlug}", defaultStatusID=`, defaultStatus);
    return defaultStatus ?? undefined;
  },
});
