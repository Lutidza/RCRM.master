// Path: src/plugins/TelegramAPI/utils/BotUtils/BotConfig.ts
// Version: 1.4.9-extended
//
// Рефакторинг: добавлено новое поле allowedCommands (опциональное),
// а также учтено существование поля protectContent в UnifiedBotConfig
// (для избежания ошибки TS2339). Остальной код сохранён из 1.4.7-refactored.

import type { UnifiedBotConfig, UnifiedBotInterface } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';

// Значения по умолчанию для интерфейса бота
const defaultInterface: UnifiedBotInterface = {
  blocks: [],
  defaultStartLayout: 'start',
  defaultFirstVisitLayout: 'start_first_visit',
  total_visit: 0,
};

/**
 * Класс BotConfig инкапсулирует все настройки бота (полученные из UnifiedBotConfig),
 * включая интерфейс и дополнительные поля (protectContent, allowedCommands, и т.д.).
 */
export class BotConfig {
  public id: number;
  public name: string;
  public token: string;
  public description?: string;
  public enabled: string;
  public initialization_status: string;
  public last_initialized?: string;
  public interface: UnifiedBotInterface;
  public protectContent: boolean;

  // [CHANGE] Добавлено новое поле для списка допустимых команд
  public allowedCommands?: string[];

  constructor(data: UnifiedBotConfig) {
    this.id = data.id;
    this.name = data.name;
    this.token = data.token;
    this.description = data.description;
    this.enabled = data.enabled;
    this.initialization_status = data.initialization_status;
    this.last_initialized = data.last_initialized;

    // Инициализация интерфейса бота
    this.interface = {
      blocks: data.interface?.blocks ?? defaultInterface.blocks,
      defaultStartLayout: data.interface?.defaultStartLayout ?? defaultInterface.defaultStartLayout,
      defaultFirstVisitLayout: data.interface?.defaultFirstVisitLayout ?? defaultInterface.defaultFirstVisitLayout,
      total_visit:
        typeof data.interface?.total_visit === 'number'
          ? data.interface?.total_visit
          : defaultInterface.total_visit,
    };

    // Если поле protectContent есть в data, используем, иначе false
    this.protectContent = data.protectContent ?? false;

    // Если поле allowedCommands уже есть в data, берём его. Иначе — пустой массив
    this.allowedCommands = data.allowedCommands ?? [];
  }

  get telegramApiToken(): string {
    return this.token;
  }
}
