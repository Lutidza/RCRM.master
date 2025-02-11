// Path: src/plugins/TelegramAPI/utils/ClientUtils/checkClientStatus.ts
// Version: 1.1.5-stable
//
// [CHANGELOG]
// - Добавлена поддержка числовых значений в поле status.
// - Если status равен undefined или null, возвращается "new" как значение по умолчанию.
// - Если status – объект с полем alias, возвращается alias; если статус – число или строка, выполняется запрос к коллекции "statuses".
// - Используется единый логгер log для отладки.
import type { Payload } from 'payload';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

export async function checkClientStatus(
  payload: Payload,
  status: any
): Promise<string | null> {
  try {
    if (status === undefined || status === null) {
      log('debug', 'checkClientStatus: status is undefined or null, defaulting to "new"');
      return "new";
    }
    if (typeof status === 'object') {
      if ('alias' in status && typeof status.alias === 'string') {
        return status.alias;
      }
      if ('id' in status) {
        const statusResult = await payload.find({
          collection: 'statuses',
          where: { id: { equals: status.id } },
          limit: 1,
        });
        const statusDoc = statusResult.docs[0];
        return statusDoc?.alias || "new";
      }
    }
    if (typeof status === 'number' || typeof status === 'string') {
      const statusResult = await payload.find({
        collection: 'statuses',
        where: { id: { equals: status } },
        limit: 1,
      });
      const statusDoc = statusResult.docs[0];
      return statusDoc?.alias || "new";
    }
  } catch (error: any) {
    log('error', `❌ Ошибка в checkClientStatus: ${error.message}`, payload);
  }
  return "new";
}
