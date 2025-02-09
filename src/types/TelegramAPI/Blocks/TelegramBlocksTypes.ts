// 📌 Путь: src/types/TelegramAPI/Blocks/TelegramBlocksTypes.ts
// 📌 Версия: 1.1.3

// Объявление перечисления BlockType
export enum BlockType {
  Layout = 'layout-blocks',
  Catalog = 'catalog-blocks',
  Message = 'message-blocks',
  Button = 'button-blocks',
  Command = 'command-blocks',
}

// Остальные типы и интерфейсы
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

// Объединение всех типов
export type TelegramSubBlock =
  | TelegramLayoutBlock
  | TelegramCatalogBlock
  | TelegramMessageBlock
  | TelegramButtonBlock
  | TelegramCommandBlock;
