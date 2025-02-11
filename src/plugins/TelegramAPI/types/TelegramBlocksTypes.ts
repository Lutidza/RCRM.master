// Path: src/plugins/TelegramAPI/types/TelegramBlocksTypes.ts
// Version: 1.1.3
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
