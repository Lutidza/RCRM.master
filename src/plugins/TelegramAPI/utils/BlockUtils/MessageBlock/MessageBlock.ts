// Path: src/plugins/TelegramAPI/utils/BlockUtils/MessageBlock/MessageBlock.ts
// Version: 1.0.12-refactored
//
// This utility processes a MessageBlock by sending its content using HTML formatting via grammY.
// If a MessageBlock contains a "buttons" field (provided via ButtonBlock), the buttons are attached via an inline keyboard.
// Added option protect_content if the bot is configured to protect content.

import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { InlineKeyboard } from 'grammy';

function getTestMediaUrl(url: string): string {
  console.log(`[DEBUG] Overriding media URL for testing. Original URL: "${url}"`);
  return "https://kvartiry-tbilisi.ru/images/resize/medium/c77626871d5920df7195a89cc44a2c85.jpg";
}

function buildInlineKeyboard(buttons: any[]): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  buttons.forEach((btn: any) => {
    const callbackType = btn.callbackType && btn.callbackType.trim() !== '' ? btn.callbackType : 'layout';
    const callbackData = btn.callback_data || '';
    const data = `${callbackType}|${callbackData}`;
    if (callbackType === 'link' && btn.url) {
      keyboard.url(btn.text, btn.url);
    } else {
      keyboard.text(btn.text, data);
    }
    if (btn.newRow) {
      keyboard.row();
    }
  });
  return keyboard;
}

export async function processMessageBlock(ctx: BotContext, blockData: any): Promise<void> {
  if (!ctx.chat) return;
  const text: string = blockData.text;
  try {
    const replyOptions: any = {
      parse_mode: 'HTML',
      protect_content: ctx.session.botConfig?.protectContent || false,
    };

    let buttonsArray: any[] = [];
    if (Array.isArray(blockData.buttons) && blockData.buttons.length > 0) {
      if (blockData.buttons[0]?.buttons) {
        blockData.buttons.forEach((btnBlock: any) => {
          if (Array.isArray(btnBlock.buttons)) {
            buttonsArray = buttonsArray.concat(btnBlock.buttons);
          }
        });
      } else {
        buttonsArray = blockData.buttons;
      }
      if (buttonsArray.length > 0) {
        replyOptions.reply_markup = buildInlineKeyboard(buttonsArray);
      }
    }

    let sentMsg;
    if (blockData.media && typeof blockData.media.url === 'string' && blockData.media.url.trim() !== "") {
      const mediaUrl = getTestMediaUrl(blockData.media.url);
      console.log(`[DEBUG] blockData.media:`);
      console.dir(blockData.media, { depth: null });
      console.log(`[DEBUG] Sending photo with test URL: "${mediaUrl}" and caption: "${text}"`);
      sentMsg = await ctx.replyWithPhoto(mediaUrl, {
        caption: text,
        ...replyOptions,
      });
    } else {
      sentMsg = await ctx.reply(text, replyOptions);
    }
    if (ctx.session && Array.isArray(ctx.session.previousMessages)) {
      ctx.session.previousMessages.push(sentMsg.message_id);
      console.log(`[DEBUG] Stored message ID: ${sentMsg.message_id}. Current previousMessages: ${ctx.session.previousMessages}`);
    }
  } catch (error: any) {
    console.error('Error processing MessageBlock:', error);
  }
}
