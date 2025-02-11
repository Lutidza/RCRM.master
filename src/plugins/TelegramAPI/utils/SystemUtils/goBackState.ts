// Path: src/plugins/TelegramAPI/utils/SystemUtils/goBackState.ts
// Version: 1.0.2-goBack_fix
//
// [CHANGELOG]
// - Реализована навигация "назад" с использованием поля previousState из сессии.
// - Если предыдущее состояние найдено, вызывается sendLayoutBlock с alias предыдущего состояния.
// - Если предыдущего состояния нет, выводится сообщение об ошибке.
import type { Payload } from 'payload';
import type { BotContext } from '@/plugins/TelegramAPI/utils/SystemUtils/clearPreviousMessages';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';
import { sendLayoutBlock } from '@/plugins/TelegramAPI/utils/BlockUtils/LayoutBlock/LayoutBlock';

export async function goBackState(ctx: BotContext, payload: Payload, botConfig: any): Promise<void> {
    try {
        if (!ctx.session.previousState) {
            await ctx.reply('Предыдущее состояние не найдено.');
            return;
        }
        // Используем alias предыдущего состояния
        const previousAlias = ctx.session.previousState.alias;
        await sendLayoutBlock(ctx, botConfig, payload, previousAlias);
        log('info', 'Команда go_back_state выполнена успешно. Пользователь возвращён к предыдущему состоянию.', payload);
    } catch (error: any) {
        log('error', `Ошибка выполнения команды go_back_state: ${error.message}`, payload);
        await ctx.reply('Ошибка при возврате в предыдущее состояние.');
    }
}
