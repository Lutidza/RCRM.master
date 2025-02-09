// 📌 Путь: src/blocks/TelegramAPI/LayoutBlock/config.ts
// 📌 Версия: 2.2.3
//
// LayoutBlock представляет лейаут интерфейса бота. Он не допускает вложенных LayoutBlock.
// Для идентификации лейаута используется поле alias (уникальный идентификатор для вызова),
// а поле name остаётся для информационного отображения в админке.
// Список вложенных блоков включает только допустимые блоки для корректной обработки.

import type { Block } from 'payload';

import MessageBlock from '@/blocks/TelegramAPI/MessageBlock/config';
import ButtonBlock from '@/blocks/TelegramAPI/ButtonBlock/config';
import CommandBlock from '@/blocks/TelegramAPI/CommandBlock/config';
import CatalogBlock from '@/blocks/TelegramAPI/CatalogBlock/config';

const LayoutBlock: Block = {
  // Слаг блока
  slug: 'layout-blocks',
  // Имя интерфейса для этого блока
  interfaceName: 'LayoutBlock',
  // Названия блока для отображения в админке
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
    // Название лейаута (для отображения в админке)
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Название лейаута',
      admin: {
        description: 'Введите название лейаута для отображения (например, "Главное меню").',
      },
    },
    // Уникальный alias для идентификации лейаута
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
    // Вложенные блоки: MessageBlock, ButtonBlock, CommandBlock, CatalogBlock
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
    // Дополнительное описание лейаута (для администраторов)
    {
      name: 'description',
      type: 'textarea',
      required: false,
      label: 'Описание лейаута',
      admin: {
        description: 'Добавьте описание для этого лейаута (опционально).',
      },
    },
  ],
};

export default LayoutBlock;
