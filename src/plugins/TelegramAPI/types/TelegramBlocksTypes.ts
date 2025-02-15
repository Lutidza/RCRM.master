// Path: src/plugins/TelegramAPI/types/TelegramBlocksTypes.ts
// Version: 2.0.6-protectContent-updated

// Подробные комментарии:
// - Добавлено поле startMessageId в SessionData
// - Остальной функционал сохранён
// - Сохраняем ссылки на BotConfig, чтобы работать со всеми настройками

import type { Context, SessionFlavor } from 'grammy';
import type { BotConfig } from '@/plugins/TelegramAPI/utils/BotUtils/BotConfig';

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

export interface FromData {
  first_name?: string;
  last_name?: string;
  username?: string;
}

export interface RenderOptions {
  page: number;
  itemsPerPage: number;
  displayMode: 'subcategories' | 'products' | 'all';
}

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
  allowedCommands?: string[];
  protectContent?: boolean;
}

// [EDIT START] Добавляем новое поле startMessageId
export interface SessionData {
  previousMessages: number[];
  stateStack: any[];
  previousState?: any;
  currentState?: TelegramLayoutBlock;
  isBanned: boolean;
  botConfig?: BotConfig;
  startMessageId?: number;
}
// [EDIT END]

export type BotContext = Context & SessionFlavor<SessionData>;
