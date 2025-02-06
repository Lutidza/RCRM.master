// Path: src/plugins/TelegramAPI/utils/processClient.ts
// Version: 1.1.2
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

    let client: any;

    // Fix: Проверка, что `docs` содержит хотя бы один элемент
    if (!docs || docs.length === 0) {
      console.log("[processClient] No existing client found, creating a new one...");

      client = await payload.create({
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
    } else {
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
      client = await payload.update({
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
    }

    // Новый блок: Проверка и блокировка клиента, если его статус имеет alias "banned"
    client = await checkClientBan(payload, client);

    return client;
  } catch (error: any) {
    console.error("[processClient] Error processing client:", error);
    return { total_visit: 1 };
  }
}

/**
 * Функция checkClientBan проверяет поле status клиента и, если статус имеет alias "banned",
 * обновляет запись клиента (например, устанавливая enabled: "disabled") и добавляет флаг isBanned.
 * Это позволяет:
 * 1. Клиент со статусом banned не сможет запускать бот и отправлять команды.
 * 2. При изменении статуса в панели администратора сессия клиента завершается.
 */
async function checkClientBan(payload: Payload, client: any): Promise<any> {
  if (client.status) {
    let banned = false;
    let statusAlias: string | undefined = undefined;

    if (typeof client.status === 'object' && client.status !== null) {
      // Если объект содержит поле alias, используем его
      if ('alias' in client.status && typeof client.status.alias === 'string') {
        statusAlias = client.status.alias;
        banned = statusAlias === 'banned';
      } else if ('id' in client.status) {
        // Если alias отсутствует, но есть id – выполняем запрос для получения полного статуса
        const statusResult = await payload.find({
          collection: 'statuses',
          where: { id: { equals: client.status.id } },
          limit: 1,
        });
        const statusDoc = statusResult.docs[0];
        if (statusDoc) {
          statusAlias = statusDoc.alias;
          banned = statusAlias === 'banned';
        }
      }
    } else {
      // Если status не является объектом, предполагаем, что это id
      const statusResult = await payload.find({
        collection: 'statuses',
        where: { id: { equals: client.status } },
        limit: 1,
      });
      const statusDoc = statusResult.docs[0];
      if (statusDoc) {
        statusAlias = statusDoc.alias;
        banned = statusAlias === 'banned';
      }
    }

    console.log(`[processClient] Client status alias: ${statusAlias}`);

    if (banned) {
      console.log(`[processClient] Client ID=${client.id} is banned. Updating status...`);
      // Обновляем клиента, отключая его (например, меняем enabled на "disabled")
      client = await payload.update({
        collection: 'clients',
        id: client.id,
        data: {
          enabled: "disabled",
        },
      });
      client.isBanned = true;
    } else {
      client.isBanned = false;
    }
  } else {
    client.isBanned = false;
  }
  return client;
}
