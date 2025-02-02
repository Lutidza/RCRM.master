// Path: src/plugins/TelegramAPI/utils/BlockUtils/MessageBlock/index.ts
// Version: 1.0.9
//
// This utility processes a MessageBlock by sending its content using HTML formatting via grammY.
// For testing purposes, if a media file is attached, instead of using the media URL from the payload,
// a fixed URL is used:
//   https://kvartiry-tbilisi.ru/images/resize/medium/c77626871d5920df7195a89cc44a2c85.jpg
// This is only for testing and should be removed or disabled in production.
// It uses standard Payload CMS v3 type definitions and grammY's Context type with session support.

import type { Context, SessionFlavor } from 'grammy';

interface SessionData {
  previousMessages: number[];
}

type BotContext = Context & SessionFlavor<SessionData>;

/**
 * For testing purposes, returns a fixed media URL.
 * In production, use getAbsoluteMediaUrl to compute the absolute URL.
 *
 * @param url - The media file URL (unused in testing).
 * @returns The fixed test media URL.
 */
function getTestMediaUrl(url: string): string {
  // Логирование для тестового URL
  console.log(`[DEBUG] Overriding media URL for testing. Original URL: "${url}"`);
  return "https://kvartiry-tbilisi.ru/images/resize/medium/c77626871d5920df7195a89cc44a2c85.jpg";
}

export async function processMessageBlock(ctx: BotContext, blockData: any): Promise<void> {
  if (!ctx.chat) return;

  // Retrieve the text from the block. The text should already contain valid HTML formatting.
  const text: string = blockData.text || '';

  try {
    let sentMsg;
    // Если поле media задано и не пустое, для теста используем фиксированный URL.
    if (blockData.media && typeof blockData.media.url === 'string' && blockData.media.url.trim() !== "") {
      const mediaUrl = getTestMediaUrl(blockData.media.url);
      console.log(`[DEBUG] blockData.media:`);
      console.dir(blockData.media, { depth: null });
      console.log(`[DEBUG] Sending photo with test URL: "${mediaUrl}" and caption: "${text}"`);
      sentMsg = await ctx.replyWithPhoto(mediaUrl, {
        caption: text,
        parse_mode: 'HTML'
      });
    } else {
      sentMsg = await ctx.reply(text, { parse_mode: 'HTML' });
    }
    if (ctx.session && Array.isArray(ctx.session.previousMessages)) {
      ctx.session.previousMessages.push(sentMsg.message_id);
      console.log(`[DEBUG] Stored message ID: ${sentMsg.message_id}. Current previousMessages: ${ctx.session.previousMessages}`);
    }
  } catch (error: any) {
    console.error('Error processing MessageBlock:', error);
  }
}
