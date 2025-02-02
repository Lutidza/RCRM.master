import type { Context, SessionFlavor } from 'grammy';

interface SessionData {
  previousMessages: number[];
}

// Изменяем тип ctx, добавляя SessionFlavor
export async function processMessageBlock(
  ctx: Context & SessionFlavor<SessionData>,
  blockData: any
): Promise<void> {
  if (!ctx.chat) return;

  const text: string = blockData.text || '';

  try {
    const sentMsg = await ctx.reply(text, { parse_mode: 'HTML' });
    // Теперь ctx.session существует, поэтому можно сохранить message_id
    if (ctx.session && Array.isArray(ctx.session.previousMessages)) {
      ctx.session.previousMessages.push(sentMsg.message_id);
    }
  } catch (error: any) {
    console.error('Error processing MessageBlock:', error);
  }
}
