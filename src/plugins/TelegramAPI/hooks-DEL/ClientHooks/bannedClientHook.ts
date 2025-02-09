// 📌 Путь: src/plugins/TelegramAPI/hooks/ClientHooks/bannedClientHook.ts
// 📌 Версия: 1.0.1
//
// [CHANGELOG]
// - Заменён console.log на log для унифицированного логирования.
// - Оптимизирована обработка статусов клиента.
// - Улучшены комментарии для лучшего понимания кода.

import type { Context } from 'grammy';
import type { Payload } from 'payload';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

interface SessionData {
  previousMessages: number[];
}

type BotContext = Context & { session: SessionData };

/**
 * Хук для проверки заблокированных клиентов.
 * Функция принимает экземпляр Payload CMS и возвращает обработчик, который:
 *  - Ищет клиента в коллекции "clients" по telegram_id,
 *  - Проверяет поле status (через alias, полученный напрямую или через запрос к коллекции "statuses"),
 *  - Если alias равен "banned", отправляет сообщение пользователю, очищает сессию и прекращает дальнейшую обработку.
 *
 * @param {Payload} payload - Экземпляр Payload CMS для выполнения запросов.
 * @returns {Function} Обработчик для использования в update-пайплайне бота.
 */
export function bannedClientHook(payload: Payload) {
  return async (ctx: BotContext, next: () => Promise<void>): Promise<void> => {
    try {
      if (ctx.from) {
        const telegramId = ctx.from.id;

        // Поиск клиента в коллекции "clients" по telegram_id
        const { docs } = await payload.find({
          collection: 'clients',
          where: { telegram_id: { equals: telegramId } },
          limit: 1,
        });

        const client = docs && docs.length > 0 ? docs[0] : null;

        if (client && client.status) {
          let banned = false;
          let statusAlias: string | undefined;

          // Обработка статуса клиента
          if (typeof client.status === 'object' && client.status !== null) {
            if ('alias' in client.status && typeof client.status.alias === 'string') {
              statusAlias = client.status.alias;
              banned = statusAlias === 'banned';
            } else if ('id' in client.status) {
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
            // Если статус передан как идентификатор
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

          log(
            'info',
            `[bannedClientHook] Client ID=${client.id} status alias: ${statusAlias}; banned: ${banned}`,
            payload
          );

          if (banned) {
            await ctx.reply("💀 Your account is locked! 💀 \n\n 🚷 Looks like you've been cast out…\n And now you can fully enjoy the void");
            // Clear the session
            ctx.session = { previousMessages: [] };
            return; // Stop further processing of the update
          }
        }
      }
      // Продолжаем обработку, если клиент не забанен
      await next();
    } catch (error: any) {
      log('error', `Ошибка в bannedClientHook: ${error.message}`, payload);
      await next(); // Продолжаем обработку при возникновении ошибки
    }
  };
}
