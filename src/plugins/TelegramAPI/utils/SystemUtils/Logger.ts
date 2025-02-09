// 📌 Путь: src/plugins/TelegramAPI/utils/SystemUtils/Logger.ts
// 📌 Версия: 1.1.0
//
// [CHANGELOG]
// - Восстановлен импорт `Payload` для устранения ошибки компиляции.
// - Актуализированы комментарии и добавлена проверка на корректность экземпляра `Payload`.
// - Улучшена обработка ошибок в блоке Payload CMS логирования.

import type { Payload } from 'payload';

/**
 * Функция логирования.
 * @param {string} level - Уровень логирования ('info', 'debug', 'error').
 * @param {string} message - Сообщение для логирования.
 * @param {Payload} [payload] - Экземпляр Payload CMS для записи лога.
 * @param {Record<string, any>} [context] - Дополнительные данные для логирования (например, объект контекста).
 */
export function log(
  level: 'info' | 'debug' | 'error',
  message: string,
  payload?: Payload,
  context?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  // Вывод в консоль
  if (context && Object.keys(context).length > 0) {
    console.log(logMessage, context);
  } else {
    console.log(logMessage);
  }

  // Вывод через Payload CMS, если доступно
  if (payload?.logger && typeof payload.logger[level] === 'function') {
    try {
      payload.logger[level](message, context || {});
    } catch (err: any) {
      console.error(
        `[${timestamp}] [ERROR] Ошибка логирования через Payload CMS: ${err.message || 'Неизвестная ошибка'}`
      );
    }
  }
}
