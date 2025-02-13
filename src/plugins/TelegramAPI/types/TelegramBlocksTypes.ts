// Path: src/plugins/TelegramAPI/types/TelegramBlocksTypes.ts
// Version: 2.0.1
// Рефакторинг: Объединение всех объявлений полей и типов в один общий файл.
// Добавлено свойство currentState в интерфейс SessionData для хранения текущего состояния (TelegramLayoutBlock).

import type { Context, SessionFlavor } from 'grammy';

/** ===============================
 * 1. Типы блоков для Telegram
 * =============================== */

/**
 * Перечисление типов блоков, используемых в плагине.
 */
export enum BlockType {
  Layout = 'layout-blocks',
  Catalog = 'catalog-blocks',
  Message = 'message-blocks',
  Button = 'button-blocks',
  Command = 'command-blocks',
}

/**
 * Интерфейс для лейаут-блока.
 * Используется для описания основного блока с вложенными подблоками.
 */
export interface TelegramLayoutBlock {
  blockType: BlockType.Layout;
  name: string;
  alias: string;
  blocks: TelegramSubBlock[];
  clearPreviousMessages?: boolean;
}

/**
 * Интерфейс для каталожного блока.
 */
export interface TelegramCatalogBlock {
  blockType: BlockType.Catalog;
  name: string;
  alias: string;
  itemsPerPage?: number;
}

/**
 * Интерфейс для текстового (message) блока.
 */
export interface TelegramMessageBlock {
  blockType: BlockType.Message;
  text: string;
}

/**
 * Интерфейс для кнопочного блока.
 */
export interface TelegramButtonBlock {
  blockType: BlockType.Button;
  text: string;
  callbackType: 'link' | 'message' | 'layout' | 'command';
  // Дополнительные поля для кнопки можно добавить при необходимости.
}

/**
 * Интерфейс для командного блока.
 */
export interface TelegramCommandBlock {
  blockType: BlockType.Command;
  command: string;
  responseText: string;
}

/**
 * Объединённый тип для подблоков.
 */
export type TelegramSubBlock =
  | TelegramLayoutBlock
  | TelegramCatalogBlock
  | TelegramMessageBlock
  | TelegramButtonBlock
  | TelegramCommandBlock;

/** ====================================
 * 2. Типы для клиентских данных
 * ==================================== */

/**
 * Интерфейс для данных, полученных от Telegram при обработке клиента.
 * Содержит только поля профиля пользователя.
 */
export interface FromData {
  first_name?: string;
  last_name?: string;
  username?: string;
}

/** ====================================
 * 3. Типы для рендеринга элементов каталога
 * ==================================== */

/**
 * Интерфейс для параметров рендеринга (например, для пагинации).
 */
export interface RenderOptions {
  page: number;
  itemsPerPage: number;
  displayMode: 'subcategories' | 'products' | 'all';
}

/** ====================================
 * 4. Типы для настроек бота
 * ==================================== */

/**
 * Интерфейс для настроек интерфейса бота.
 * Поле blocks использует объединённый тип TelegramSubBlock.
 */
export interface UnifiedBotInterface {
  blocks: TelegramSubBlock[];
  defaultStartLayout: string;
  defaultFirstVisitLayout: string;
  total_visit: number;
}

/**
 * Интерфейс для общей конфигурации бота.
 */
export interface UnifiedBotConfig {
  id: number;
  name: string;
  token: string;
  description?: string;
  enabled: string;
  initialization_status: string;
  last_initialized?: string;
  interface?: Partial<UnifiedBotInterface>;
}

/** ====================================
 * 5. Типы для сессии и контекста бота
 * ==================================== */

/**
 * Интерфейс для данных сессии.
 */
export interface SessionData {
  previousMessages: number[];
  stateStack: any[];
  previousState?: any;
  currentState?: TelegramLayoutBlock; // Добавлено новое свойство для хранения текущего состояния
  isBanned: boolean;
}

/**
 * Тип для контекста бота, расширяющий стандартный Context от grammy.
 */
export type BotContext = Context & SessionFlavor<SessionData>;
