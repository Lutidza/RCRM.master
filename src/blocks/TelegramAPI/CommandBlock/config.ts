// Путь: src/blocks/TelegramAPI/CommandBlock/config.ts
// Версия: 2.1.1
//
// CommandBlock хранит команды, которые будут автоматически регистрироваться в Telegram.
// Добавлено поле commandType для выбора типа команды: "Команда" или "Открыть лейаут".
// Поле alias не требуется, так как команда сама по себе уникальна.
import type { Block } from 'payload';

const CommandBlock: Block = {
  slug: 'command-blocks',
  interfaceName: 'CommandBlock',
  labels: {
    singular: 'Command Block',
    plural: 'Command Blocks',
  },
  fields: [
    // Скрытое поле для типа блока
    {
      name: 'blockType',
      type: 'text',
      defaultValue: 'CommandBlock',
      admin: { hidden: true },
    },
    // Команда (например, /start, /help)
    {
      name: 'command',
      type: 'text',
      required: true,
      label: 'Команда',
      defaultValue: '/start',
      admin: {
        description: 'Введите команду Telegram, начинающуюся с /. Пример: "/help".',
      },
    },
    // Выбор типа команды: "Команда" или "Открыть лейаут"
    {
      name: 'commandType',
      type: 'select',
      required: true,
      label: 'Тип команды',
      options: [
        { label: 'Команда', value: 'command' },
        { label: 'Открыть лейаут', value: 'open_layout' },
      ],
      defaultValue: 'command',
      admin: {
        description:
          'Выберите тип команды. "Команда" – бот отправляет ответное сообщение; "Открыть лейаут" – бот открывает лейаут по alias.',
      },
    },
    // Текст ответа (используется, если тип команды "Команда")
    {
      name: 'responseText',
      type: 'textarea',
      required: true,
      label: 'Текст ответа',
      defaultValue: 'Пример ответа команды',
      admin: {
        condition: (_, { commandType }) => commandType === 'command',
        description: 'Введите текст ответа для команды, если выбран тип "Команда".',
      },
    },
  ],
};

export default CommandBlock;
