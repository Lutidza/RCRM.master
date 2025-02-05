// Path: src/plugins/TelegramAPI/utils/processClient.ts
// Version: 1.1.1
//
// This utility processes clients in the "clients" collection. It searches for a client by `telegram_id`.
// If the client exists, it updates the data (increments `total_visit`, adds a bot if missing).
// If the client does not exist, it creates a new record and assigns default properties.

import type { Payload } from 'payload';

export async function processClient(
  payload: Payload,
  telegramId: number,
  botId: number,
  fromData: any
): Promise<any> {
  try {
    console.log(`[processClient] Searching for client with telegram_id=${telegramId} and bot=${botId}`);

    // Find existing client
    const { docs } = await payload.find({
      collection: 'clients',
      where: { telegram_id: { equals: telegramId } },
      limit: 1,
    });

    // Fix: Проверка, что `docs` содержит хотя бы один элемент
    if (!docs || docs.length === 0) {
      console.log("[processClient] No existing client found, creating a new one...");

      return await payload.create({
        collection: 'clients',
        data: {
          telegram_id: telegramId,
          bots: [botId],
          first_name: fromData.first_name ?? "",
          last_name: fromData.last_name ?? "",
          user_name: fromData.username || 'anonymous_user',
          total_visit: 1,
          last_visit: new Date().toISOString(),
          enabled: "enabled", // Ensures compatibility with Payload CMS
        },
      });
    }

    // Fix: Теперь `docs[0]` гарантированно существует
    const existingClient = docs[0];

    if (!existingClient) {
      console.log("[processClient] Unexpected: existingClient is undefined.");
      return;
    }

    console.log(`[processClient] Client found: ID=${existingClient.id}`);

    // Extract and normalize bots array
    let botsArray: any[] = Array.isArray(existingClient.bots)
      ? existingClient.bots
      : existingClient.bots ? [existingClient.bots] : [];

    // Add botId if it's not already in the list
    if (!botsArray.some(b => (typeof b === 'object' ? b.id.toString() === botId.toString() : b.toString() === botId.toString()))) {
      botsArray.push(botId);
      console.log(`[processClient] Bot ${botId} added to client ${existingClient.id}`);
    }

    // Update client data
    return await payload.update({
      collection: 'clients',
      id: existingClient.id,
      data: {
        bots: botsArray,
        first_name: fromData.first_name ?? existingClient.first_name ?? "",
        last_name: fromData.last_name ?? existingClient.last_name ?? "",
        user_name: fromData.username || existingClient.user_name || 'anonymous_user',
        last_visit: new Date().toISOString(),
        total_visit: (existingClient.total_visit ?? 0) + 1,
      },
    });
  } catch (error: any) {
    console.error("[processClient] Error processing client:", error);
    return { total_visit: 1 };
  }
}
