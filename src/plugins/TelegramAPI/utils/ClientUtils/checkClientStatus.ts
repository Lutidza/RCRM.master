// 📌 Путь: src/plugins/TelegramAPI/utils/ClientUtils/checkClientStatus.ts
// 📌 Версия: 1.0.0
//
// [CHANGELOG]
// - Вынесена логика проверки статуса клиента из `bannedClient` в отдельную функцию.
// - Оптимизирована обработка статусов.

import type { Payload } from 'payload';

/**
 * Проверяет статус клиента и возвращает его alias.
 * @param payload - Экземпляр Payload CMS.
 * @param status - Поле `status` клиента (может быть объектом или идентификатором).
 * @returns {Promise<string | null>} Возвращает alias статуса клиента или null, если статус отсутствует.
 */
export async function checkClientStatus(
  payload: Payload,
  status: any
): Promise<string | null> {
  try {
    if (typeof status === 'object' && status !== null) {
      // Если статус уже содержит alias
      if ('alias' in status && typeof status.alias === 'string') {
        return status.alias;
      }
      // Если статус передан как объект с id
      if ('id' in status) {
        const statusResult = await payload.find({
          collection: 'statuses',
          where: { id: { equals: status.id } },
          limit: 1,
        });
        const statusDoc = statusResult.docs[0];
        return statusDoc?.alias || null;
      }
    } else if (typeof status === 'string') {
      // Если статус передан как идентификатор
      const statusResult = await payload.find({
        collection: 'statuses',
        where: { id: { equals: status } },
        limit: 1,
      });
      const statusDoc = statusResult.docs[0];
      return statusDoc?.alias || null;
    }
  } catch (error: any) {
    console.error('❌ Ошибка в checkClientStatus:', error.message);
  }

  return null;
}
