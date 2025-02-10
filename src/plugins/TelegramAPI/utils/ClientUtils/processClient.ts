// Path: src/plugins/TelegramAPI/utils/ClientUtils/processClient.ts
// Version: 1.3.8
//
// [CHANGELOG]
// - При создании нового клиента поле status не передаётся вовсе, позволяя установить значение по умолчанию
//   на стороне коллекции (через defaultValue или beforeChange-хук).
// - Добавлено логирование значения client.status после создания/обновления клиента.
// - Нормализовано поле bots с дополнительными проверками для устранения ошибки TS2532.
// - Поле status не изменяется ботом – изменение статуса происходит только через админ-панель.
import type { Payload } from 'payload';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { checkClientStatus } from './checkClientStatus';

interface FromData {
  first_name?: string;
  last_name?: string;
  username?: string;
}

/**
 * Обрабатывает клиента в коллекции "clients".
 * Если клиент не найден, создаётся новый, при этом поле status не передаётся,
 * чтобы на стороне коллекции (через defaultValue или beforeChange-хук) было установлено значение по умолчанию.
 * Если клиент найден, обновляются его данные.
 * @param payload - Экземпляр Payload CMS.
 * @param telegramId - Telegram ID пользователя.
 * @param botId - Идентификатор бота.
 * @param fromData - Данные пользователя из Telegram (first_name, last_name, username).
 * @returns Обновлённые или созданные данные клиента.
 */
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
          telegram_id: telegramId,
          bots: [botId],
          first_name: fromData.first_name ?? "",
          last_name: fromData.last_name ?? "",
          user_name: fromData.username || 'anonymous_user',
          total_visit: 1,
          last_visit: new Date().toISOString(),
          enabled: "enabled"
          // Поле status не передаётся, чтобы вебхук или defaultValue в коллекции установил его автоматически.
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
