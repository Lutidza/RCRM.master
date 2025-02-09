// 📌 Путь: src/plugins/TelegramAPI/utils/processClient.ts
// 📌 Версия: 1.2.1
//
// [CHANGELOG]
// - Исправлена ошибка TS18048, связанная с потенциальным undefined для existingClient.
// - Улучшена типизация и добавлены явные утверждения типов.

import type { Payload } from 'payload';
import { checkClientStatus } from '@/plugins/TelegramAPI/utils/ClientUtils/checkClientStatus';

/**
 * Обработка клиента в коллекции "clients".
 * @param {Payload} payload - Экземпляр Payload CMS.
 * @param {number} telegramId - Telegram ID пользователя.
 * @param {number} botId - Идентификатор бота.
 * @param {any} fromData - Данные пользователя из Telegram (имя, фамилия, username).
 * @returns {Promise<any>} Обновлённые или созданные данные клиента.
 */
export async function processClient(
  payload: Payload,
  telegramId: number,
  botId: number,
  fromData: any
): Promise<any> {
  try {
    console.log(`[processClient] Searching for client with telegram_id=${telegramId} and bot=${botId}`);

    // Поиск существующего клиента
    const { docs } = await payload.find({
      collection: 'clients',
      where: { telegram_id: { equals: telegramId } },
      limit: 1,
    });

    let client: any;

    if (!docs || docs.length === 0) {
      console.log("[processClient] No existing client found, creating a new one...");

      // Создаём нового клиента
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
          enabled: "enabled", // Совместимость с Payload CMS
        },
      });
    } else {
      const existingClient = docs[0]!; // Утверждаем, что docs[0] существует

      console.log(`[processClient] Client found: ID=${existingClient.id}`);

      // Нормализация поля bots
      let botsArray: any[] = Array.isArray(existingClient.bots)
        ? existingClient.bots
        : existingClient.bots ? [existingClient.bots] : [];

      // Добавляем botId, если он отсутствует
      if (!botsArray.some(b => (typeof b === 'object' ? b.id.toString() === botId.toString() : b.toString() === botId.toString()))) {
        botsArray.push(botId);
        console.log(`[processClient] Bot ${botId} added to client ${existingClient.id}`);
      }

      // Обновляем клиента
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

    // Проверяем статус клиента (используем checkClientStatus)
    const statusAlias = await checkClientStatus(payload, client.status);
    const isBanned = statusAlias === 'banned';

    if (isBanned) {
      console.log(`[processClient] Client ID=${client.id} is banned. Updating status...`);
      // Обновляем клиента, отключая его
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

    return client;
  } catch (error: any) {
    console.error("[processClient] Error processing client:", error);
    return { total_visit: 1 };
  }
}
