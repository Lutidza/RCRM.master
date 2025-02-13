// Path: src/plugins/TelegramAPI/types/TelegramBlocksTypes.ts
// Version: 2.0.1
// Рефакторинг: Объединение всех объявлений полей и типов в один общий файл.
// Добавлено свойство currentState в интерфейс SessionData для хранения текущего состояния (TelegramLayoutBlock).

import type { Context, SessionFlavor } from 'grammy';

/** ===============================
 * 1. Типы блоков для Telegram
 * =============================== */

export enum BlockType {
  Layout = 'layout-blocks',
  Catalog = 'catalog-blocks',
  Message = 'message-blocks',
  Button = 'button-blocks',
  Command = 'command-blocks',
}

export interface TelegramLayoutBlock {
  blockType: BlockType.Layout;
  name: string;
  alias: string;
  blocks: TelegramSubBlock[];
  clearPreviousMessages?: boolean;
}

export interface TelegramCatalogBlock {
  blockType: BlockType.Catalog;
  name: string;
  alias: string;
  itemsPerPage?: number;
}

export interface TelegramMessageBlock {
  blockType: BlockType.Message;
  text: string;
}

export interface TelegramButtonBlock {
  blockType: BlockType.Button;
  text: string;
  callbackType: 'link' | 'message' | 'layout' | 'command';
}

export interface TelegramCommandBlock {
  blockType: BlockType.Command;
  command: string;
  responseText: string;
}

export type TelegramSubBlock =
  | TelegramLayoutBlock
  | TelegramCatalogBlock
  | TelegramMessageBlock
  | TelegramButtonBlock
  | TelegramCommandBlock;

/** ====================================
 * 2. Типы для клиентских данных
 * ==================================== */

export interface FromData {
  first_name?: string;
  last_name?: string;
  username?: string;
}

/** ====================================
 * 3. Типы для рендеринга элементов каталога
 * ==================================== */

export interface RenderOptions {
  page: number;
  itemsPerPage: number;
  displayMode: 'subcategories' | 'products' | 'all';
}

/** ====================================
 * 4. Типы для настроек бота
 * ==================================== */

export interface UnifiedBotInterface {
  blocks: TelegramSubBlock[];
  defaultStartLayout: string;
  defaultFirstVisitLayout: string;
  total_visit: number;
}

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

export interface SessionData {
  previousMessages: number[];
  stateStack: any[];
  previousState?: any;
  currentState?: TelegramLayoutBlock;
  isBanned: boolean;
}

export type BotContext = Context & SessionFlavor<SessionData>;
