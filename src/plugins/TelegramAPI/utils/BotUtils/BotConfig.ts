// Path: src/plugins/TelegramAPI/utils/BotUtils/BotConfig.ts
// Version: 1.3.0
// Рефакторинг: Обновлён конструктор, чтобы гарантировать, что свойство interface всегда содержит
// необходимые поля (blocks, defaultStartLayout, defaultFirstVisitLayout и total_visit). Это решает проблему,
// когда вычисляемые свойства (например, currentLayoutAlias) возвращают undefined, хотя данные в базе существуют.

import type { UnifiedBotConfig } from './initializeBots';

export class BotConfig {
  // Поля, полученные из базы данных (UnifiedBotConfig)
  public id: number;
  public name: string;
  public token: string;
  public description?: string;
  public enabled: string;
  public initialization_status: string;
  public last_initialized?: string;
  public interface: {
    blocks: any[];
    defaultStartLayout: string;
    defaultFirstVisitLayout: string;
    total_visit: number;
  };

  constructor(data: UnifiedBotConfig) {
    this.id = data.id;
    this.name = data.name;
    this.token = data.token;
    this.description = data.description;
    this.enabled = data.enabled;
    this.initialization_status = data.initialization_status;
    this.last_initialized = data.last_initialized;
    // Если data.interface отсутствует или не содержит необходимых ключей,
    // устанавливаем значения по умолчанию.
    if (!data.interface) {
      this.interface = {
        blocks: [],
        defaultStartLayout: 'start',
        defaultFirstVisitLayout: 'start_first_visit',
        total_visit: 0,
      };
    } else {
      // Если поле total_visit отсутствует – задаём значение по умолчанию (0)
      this.interface = {
        blocks: Array.isArray(data.interface.blocks) ? data.interface.blocks : [],
        defaultStartLayout: data.interface.defaultStartLayout,
        defaultFirstVisitLayout: data.interface.defaultFirstVisitLayout,
        total_visit: typeof data.interface.total_visit === 'number' ? data.interface.total_visit : 0,
      };
    }
  }

  // Вычисляемое поле для получения токена Telegram API.
  get telegramApiToken(): string {
    return this.token;
  }

  // Вычисляемое поле для определения текущего layout-алиаса.
  // Если total_visit равен 1 (пользователь новый), возвращается defaultFirstVisitLayout, иначе – defaultStartLayout.
  get currentLayoutAlias(): string {
    const { defaultFirstVisitLayout, defaultStartLayout, total_visit } = this.interface;
    return total_visit === 1 ? defaultFirstVisitLayout : defaultStartLayout;
  }

  // Вычисляемое поле, которое возвращает конкретный layout-блок из массива блоков интерфейса,
  // соответствующий текущему layout-алиасу.
  get currentLayoutBlock(): any | undefined {
    return this.interface.blocks.find((block: any) => block.alias === this.currentLayoutAlias);
  }

  // TODO: Добавьте дополнительные виртуальные (computed) поля по необходимости для интеграции с Telegram API.
}
