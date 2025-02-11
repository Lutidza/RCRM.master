// Path: src/plugins/TelegramAPI/utils/ClientUtils/bannedClient.ts
// Version: 1.2.3-stable
//
// [CHANGELOG]
// - Объединена логика проверки бана в один middleware.
// - Сначала проверяется сессионный флаг isBanned; если он установлен, дальнейшая обработка прекращается.
// - Если флаг не установлен, выполняется проверка статуса клиента через checkClientStatus.
// - Если alias равен "banned", отправляется сообщение и флаг isBanned сохраняется в сессии.
// - Используется единый логгер log для отладки.
import type { Context } from 'grammy';
import type { Payload } from 'payload';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { checkClientStatus } from './checkClientStatus';

export function bannedClientHook(payload: Payload) {
  return async (ctx: Context & { session: any }, next: () => Promise<void>): Promise<void> => {
    try {
      if (ctx.session.isBanned) {
        await ctx.reply("💀 Your account is locked! 💀 \n\n🚷 You've been banned.");
        log('info', 'bannedClientHook: Session indicates client is banned, skipping processing.', payload);
        return;
      }
      if (ctx.from) {
        const telegramId = ctx.from.id;
        const { docs } = await payload.find({
          collection: 'clients',
          where: { telegram_id: { equals: telegramId } },
          limit: 1,
        });
        const client = docs.length > 0 ? docs[0] : null;
        if (client && client.status) {
          const statusAlias = await checkClientStatus(payload, client.status);
          if (statusAlias === 'banned') {
            await ctx.reply("💀 Your account is locked! 💀 \n\n🚷 You've been banned.");
            log('info', `bannedClientHook: Client ID=${client.id} is banned according to DB check.`, payload);
            ctx.session.isBanned = true;
            return;
          }
        }
      }
      await next();
    } catch (error: any) {
      log('error', `bannedClientHook: Error checking ban status: ${error.message}`, payload);
      await next();
    }
  };
}
