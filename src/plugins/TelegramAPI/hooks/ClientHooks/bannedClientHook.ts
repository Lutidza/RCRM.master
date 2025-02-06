import type { Context } from 'grammy';
import type { Payload } from 'payload';

interface SessionData {
  previousMessages: number[];
}

type BotContext = Context & { session: SessionData };

/**
 * Custom hook for checking if a client is banned.
 * This function accepts a Payload CMS instance and returns a handler that:
 *  - Retrieves the client from the "clients" collection by telegram_id,
 *  - Checks the status field (using the alias, obtained either directly or via a query to the "statuses" collection),
 *  - If the alias is "banned", sends a message to the user, clears the session, and stops further processing.
 *
 * @param payload - The Payload CMS instance used for making requests
 * @returns A handler to be used in the bot's update pipeline
 */
export function bannedClientHook(payload: Payload) {
  return async (ctx: BotContext, next: () => Promise<void>): Promise<void> => {
    if (ctx.from) {
      const telegramId = ctx.from.id;
      // Retrieve the client from the "clients" collection by telegram_id
      const { docs } = await payload.find({
        collection: 'clients',
        where: { telegram_id: { equals: telegramId } },
        limit: 1,
      });
      const client = docs && docs.length ? docs[0] : null;
      if (client && client.status) {
        let banned = false;
        let statusAlias: string | undefined = undefined;
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
          // If status is not an object, assume it is an id
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
        console.log(
          `[bannedClientHook] Client ID=${client.id} status alias: ${statusAlias}; banned: ${banned}`
        );
        if (banned) {
          await ctx.reply("💀 Your account is locked! 💀 \n\n 🚷 Looks like you've been cast out…\n And now you can fully enjoy the void");
          // Clear the session
          ctx.session = { previousMessages: [] };
          return; // Stop further processing of the update
        }
      }
    }
    await next();
  };
}
