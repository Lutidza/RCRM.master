// Path: src/plugins/TelegramAPI/utils/processClient.ts
// Version: 1.0.6
//
// This utility implements the function processClient which searches for a client by telegram_id.
// If the client is found, it updates the client data by incrementing total_visit by 1 and
// adds the current bot to the "bots" field (if it is not already present).
// When checking the "bots" array, it takes into account that its elements can be objects with an "id" field or simple values.
// If the client is not found, it creates a new client with total_visit set to 1.
// Default status assignment has been removed – the "status" field will be configured via the admin panel.
import type { Payload } from 'payload';

export async function processClient(
  payload: Payload,
  telegramId: number,
  botId: number,
  fromData: any
): Promise<any> {
  try {
    const { docs } = await payload.find({
      collection: 'clients',
      where: { telegram_id: { equals: telegramId } },
      limit: 1,
    });

    if (docs && docs.length > 0) {
      const existingClient = docs[0]!; // client found
      let botsArray: any[] = [];
      // Retrieve the value of the "bots" field
      if ((existingClient as any).bots) {
        if (Array.isArray((existingClient as any).bots)) {
          botsArray = (existingClient as any).bots;
        } else {
          botsArray = [(existingClient as any).bots];
        }
      }
      // Check if the current botId is already present in the array.
      // If an element is an object, compare its "id" property.
      const botAlreadyAdded = botsArray.some((b: any) => {
        if (typeof b === 'object' && b !== null && 'id' in b) {
          return b.id.toString() === botId.toString();
        }
        return b.toString() === botId.toString();
      });
      if (!botAlreadyAdded) {
        botsArray.push(botId);
        await payload.update({
          collection: 'clients',
          id: existingClient.id,
          data: { bots: botsArray } as any,
        });
      }
      // Increment total_visit by 1 on every /start call
      const updated = await payload.update({
        collection: 'clients',
        id: existingClient.id,
        data: {
          first_name: fromData.first_name,
          last_name: fromData.last_name,
          user_name: fromData.username || 'anonymous_user',
          last_visit: new Date().toISOString(),
          total_visit: (((existingClient as any).total_visit) ?? 0) + 1,
        },
      });
      return updated;
    } else {
      // If the client is not found, create a new one with total_visit = 1.
      // Note: The "status" field is not set here; it will be configured via the admin panel.
      const created = await payload.create({
        collection: 'clients',
        data: {
          telegram_id: telegramId,
          bots: [botId] as any,
          first_name: fromData.first_name,
          last_name: fromData.last_name,
          user_name: fromData.username || 'anonymous_user',
          total_visit: 1,
          last_visit: new Date().toISOString(),
        },
      });
      return created;
    }
  } catch (error: any) {
    return { status: 'new', total_visit: 1 };
  }
}
