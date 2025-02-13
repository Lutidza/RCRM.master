// Path: src/plugins/TelegramAPI/utils/SystemUtils/goBackState.ts
// Version: 1.0.4-goBack_stack
// Рефакторинг: Используем stateStack и currentState для корректного возврата к предыдущему состоянию.

import type { Payload } from 'payload';
import type { BotContext } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { sendLayoutBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/LayoutBlock/LayoutBlock';
import { clearPreviousMessages } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';

export async function goBackState(ctx: BotContext, payload: Payload, botConfig: any): Promise<void> {
  try {
    // Очищаем все предыдущие сообщения
    await clearPreviousMessages(ctx);

    // Извлекаем предыдущее состояние из стека, если оно есть
    let previousState = null;
    if (ctx.session.stateStack && ctx.session.stateStack.length > 0) {
      previousState = ctx.session.stateStack.pop();
    } else if (ctx.session.currentState) {
      // Если стек пуст, можно использовать текущее состояние как fallback
      previousState = ctx.session.currentState;
    }

    if (!previousState || !previousState.alias) {
      await ctx.reply('Предыдущее состояние не найдено.');
      return;
    }

    // Обновляем текущее состояние
    ctx.session.currentState = previousState;

    // Восстанавливаем layout по alias предыдущего состояния
    await sendLayoutBlock(ctx, botConfig, payload, previousState.alias);
    log('info', 'Команда go_back_state выполнена успешно. Пользователь возвращён к предыдущему состоянию.', payload);
  } catch (error: any) {
    log('error', `Ошибка выполнения команды go_back_state: ${error.message}`, payload);
    await ctx.reply('Ошибка при возврате в предыдущее состояние.');
  }
}
