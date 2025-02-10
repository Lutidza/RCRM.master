// Path: src/plugins/TelegramAPI/utils/BotUtils/BotConfig.ts
// Version: 1.4.0
// Рефакторинг: Убрано вычисление текущего layout-алиаса для новых пользователей,
// так как выбор лейаута теперь производится на стороне клиента.
// BotConfig теперь служит исключительно для хранения настроек бота.
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
    // Если data.interface отсутствует или не содержит необходимых ключей, устанавливаем значения по умолчанию.
    if (!data.interface) {
      this.interface = {
        blocks: [],
        defaultStartLayout: 'start',
        defaultFirstVisitLayout: 'start_first_visit',
        total_visit: 0,
      };
    } else {
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

  // Убраны вычисляемые свойства currentLayoutAlias и currentLayoutBlock,
  // поскольку выбор лейаута теперь производится на стороне клиента с учетом данных клиента.
  // При необходимости можно добавить метод, принимающий параметр (например, clientTotalVisit)
  // для определения нужного layout-алиаса.
}
