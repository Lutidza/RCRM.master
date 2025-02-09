// 📌 Путь: src/plugins/TelegramAPI/utils/ClientUtils/bannedClient.ts
// 📌 Версия: 1.1.0
//
// [CHANGELOG]
// - Вынесена логика проверки статуса клиента в отдельную функцию `checkClientStatus`.
// - Оптимизирован код и комментарии.

import type { Context } from 'grammy';
import type { Payload } from 'payload';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { checkClientStatus } from './checkClientStatus';

interface SessionData {
  previousMessages: number[];
}

type BotContext = Context & { session: SessionData };

/**
 * Хук для проверки заблокированных клиентов.
 * @param {Payload} payload - Экземпляр Payload CMS.
 * @returns {Function} Обработчик для использования в update-пайплайне бота.
 */
export function bannedClientHook(payload: Payload) {
  return async (ctx: BotContext, next: () => Promise<void>): Promise<void> => {
    try {
      if (ctx.from) {
        const telegramId = ctx.from.id;

        // Поиск клиента в коллекции "clients"
        const { docs } = await payload.find({
          collection: 'clients',
          where: { telegram_id: { equals: telegramId } },
          limit: 1,
        });

        const client = docs.length > 0 ? docs[0] : null;

        if (client && client.status) {
          // Проверяем alias статуса клиента
          const statusAlias = await checkClientStatus(payload, client.status);
          const isBanned = statusAlias === 'banned';

          log(
            'info',
            `[bannedClientHook] Client ID=${client.id}, status alias: ${statusAlias}, banned: ${isBanned}`,
            payload
          );

          if (isBanned) {
            await ctx.reply("💀 Your account is locked! 💀 \n\n 🚷 Looks like you've been cast out…\n And now you can fully enjoy the void");
            // Очистка сессии
            ctx.session = { previousMessages: [] };
            return; // Останавливаем дальнейшую обработку
          }
        }
      }

      // Продолжаем обработку, если клиент не забанен
      await next();
    } catch (error: any) {
      log('error', `Ошибка в bannedClientHook: ${error.message}`, payload);
      await next(); // Не блокируем дальнейшую обработку при ошибке
    }
  };
}
