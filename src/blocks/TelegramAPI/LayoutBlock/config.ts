// Путь: src/blocks/TelegramAPI/LayoutBlock/config.ts
// Версия: 2.2.1
//
// LayoutBlock представляет лейаут интерфейса бота. Он не допускает вложенных LayoutBlock.
// Для идентификации лейаута используется поле alias (уникальный идентификатор для вызова),
// а поле name остаётся для информационного отображения в админке.
import type { Block } from 'payload';

import MessageBlock from '@/blocks/TelegramAPI/MessageBlock/config';
import ButtonBlock from '@/blocks/TelegramAPI/ButtonBlock/config';
import CommandBlock from '@/blocks/TelegramAPI/CommandBlock/config';
import CatalogBlock from '@/blocks/TelegramAPI/CatalogBlock/config';

const LayoutBlock: Block = {
  slug: 'layout-blocks',
  interfaceName: 'LayoutBlock',
  labels: {
    singular: 'Layout Block',
    plural: 'Layout Blocks',
  },
  fields: [
    // Скрытое поле для типа блока
    {
      name: 'blockType',
      type: 'text',
      defaultValue: 'LayoutBlock',
      admin: { hidden: true },
    },
    // Имя лейаута (информационное для администратора)
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Название лейаута',
      admin: {
        description: 'Введите название лейаута для отображения (например, "Главное меню").',
      },
    },
    // Alias лейаута – уникальный идентификатор для вызова лейаута (без пробелов)
    {
      name: 'alias',
      type: 'text',
      required: true,
      label: 'Alias лейаута',
      admin: {
        description:
          'Введите уникальный alias лейаута для вызова. Пример: "start_first_visit" или "start".',
      },
    },
    // Вложенные блоки – разрешены только MessageBlock, ButtonBlock и CommandBlock
    {
      name: 'blocks',
      type: 'blocks',
      label: 'Вложенные блоки',
      blocks: [
        MessageBlock,
        ButtonBlock,
        CommandBlock,
        CatalogBlock,
      ],
      admin: {
        description: 'Добавьте вложенные блоки, которые будут отображены внутри лейаута.',
      },
    },
    // Флаг очистки предыдущих сообщений перед отображением лейаута
    {
      name: 'clearPreviousMessages',
      type: 'checkbox',
      defaultValue: false,
      label: 'Удалить предыдущие сообщения',
      admin: {
        description:
          'Если включено, перед отображением лейаута будут удалены все предыдущие сообщения пользователя.',
      },
    },
  ],
};

export default LayoutBlock;
