// Path: src/plugins/TelegramAPI/utils/BotUtils/BotConfig.ts
// Version: 1.4.7-refactored
//
// Рефакторинг: Обновлён конструктор для включения нового свойства protectContent.

import type { UnifiedBotConfig, UnifiedBotInterface } from '@/plugins/TelegramAPI/types/TelegramBlocksTypes';

const defaultInterface: UnifiedBotInterface = {
  blocks: [],
  defaultStartLayout: 'start',
  defaultFirstVisitLayout: 'start_first_visit',
  total_visit: 0,
};

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

  constructor(data: UnifiedBotConfig) {
    this.id = data.id;
    this.name = data.name;
    this.token = data.token;
    this.description = data.description;
    this.enabled = data.enabled;
    this.initialization_status = data.initialization_status;
    this.last_initialized = data.last_initialized;
    this.interface = {
      blocks: data.interface?.blocks ?? defaultInterface.blocks,
      defaultStartLayout: data.interface?.defaultStartLayout ?? defaultInterface.defaultStartLayout,
      defaultFirstVisitLayout: data.interface?.defaultFirstVisitLayout ?? defaultInterface.defaultFirstVisitLayout,
      total_visit: typeof data.interface?.total_visit === 'number'
        ? data.interface.total_visit
        : defaultInterface.total_visit,
    };
    this.protectContent = (data as any).protectContent ?? false;
  }

  get telegramApiToken(): string {
    return this.token;
  }
}
