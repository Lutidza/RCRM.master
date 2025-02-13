// Path: src/plugins/TelegramAPI/utils/ClientUtils/processClient.ts
// Version: 1.3.9-refactored
// Рефакторинг: Удалено локальное объявление типа FromData, импортирован из общего файла TelegramBlocksTypes.ts.
// Поля telegramId и botId передаются отдельно, так как они не являются частью данных профиля Telegram.

import type { Payload } from 'payload';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { checkClientStatus } from './checkClientStatus';
// Импорт типа FromData из общего файла с типами
import type { FromData } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';

export async function processClient(
  payload: Payload,
  telegramId: number,
  botId: number,
  fromData: FromData
): Promise<any> {
  try {
    log('info', `[processClient] Searching for client with telegram_id=${telegramId} and bot=${botId}`, payload);

    const { docs } = await payload.find({
      collection: 'clients',
      where: { telegram_id: { equals: telegramId } },
      limit: 1,
    });

    let client: any;

    if (!docs || docs.length === 0) {
      log('info', "[processClient] No existing client found, creating a new one...", payload);
      client = await payload.create({
        collection: 'clients',
        data: {
          telegram_id: telegramId,                   // Уникальный идентификатор пользователя Telegram
          bots: [botId],                             // Идентификатор бота
          first_name: fromData.first_name ?? "",
          last_name: fromData.last_name ?? "",
          user_name: fromData.username || 'anonymous_user',
          total_visit: 1,                            // Первое посещение
          last_visit: new Date().toISOString(),      // Текущая дата как дата последнего визита
          enabled: "enabled"
          // Поле status не передаётся, чтобы его значение установилось через defaultValue или beforeChange-хук в коллекции.
        },
      });
    } else {
      const existingClient = docs[0]!;
      log('info', `[processClient] Client found: ID=${existingClient.id}`, payload);
      let botsArray: any[] = Array.isArray(existingClient.bots)
        ? existingClient.bots
        : existingClient.bots ? [existingClient.bots] : [];
      if (!botsArray.some(b =>
        b != null && typeof b === 'object'
          ? b.id !== undefined && b.id.toString() === botId.toString()
          : b != null && b.toString() === botId.toString()
      )) {
        botsArray.push(botId);
        log('info', `[processClient] Bot ${botId} added to client ${existingClient.id}`, payload);
      }
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

    log('debug', `[processClient] Client status: ${client.status}`, payload);
    const statusAlias = await checkClientStatus(payload, client.status);
    log('debug', `[processClient] Retrieved status alias: ${statusAlias}`, payload);
    const isBanned = statusAlias === 'banned';

    if (isBanned) {
      log('info', `[processClient] Client ID=${client.id} is banned. Updating status...`, payload);
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
    log('error', `[processClient] Error processing client: ${error.message}`, payload);
    return { total_visit: 1 };
  }
}
