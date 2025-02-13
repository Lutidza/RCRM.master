// Path: src/blocks/TelegramAPI/MessageBlock/config.ts
// Version: 1.2.1
//
// MessageBlock используется для отправки текстовых сообщений и/или медиа.
// Доработка: Добавлено поле "buttons" для вложенных кнопок, которые будут прикреплены к тому же сообщению.
// При использовании MessageBlock дочерний ButtonBlock отображается без вывода своего поля description.

import type { Block } from 'payload';
import ButtonBlock from '@/blocks/TelegramAPI/ButtonBlock/config';

const MessageBlock: Block = {
  slug: 'message-blocks',
  interfaceName: 'MessageBlock',
  labels: {
    singular: 'Message Block',
    plural: 'Message Blocks',
  },
  fields: [
    // Скрытое поле blockType для автоматической идентификации типа блока
    {
      name: 'blockType',
      type: 'text',
      defaultValue: 'MessageBlock',
      admin: { hidden: true },
    },
    // Обязательное поле для текста сообщения
    {
      name: 'text',
      type: 'textarea',
      required: true,
      label: 'Текст сообщения',
      admin: {
        description: 'Введите текст сообщения, который будет отправлен пользователю.',
      },
    },
    // Медиа-файл (если необходимо)
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'Медиа-файл',
      admin: {
        description: 'Загрузите изображение или другое медиа, которое будет отправлено с сообщением (необязательно).',
      },
    },
    // Поле для кнопок. При использовании как дочернего блока MessageBlock
    // выводятся только кнопки (описание из ButtonBlock не используется).
    {
      name: 'buttons',
      type: 'blocks',
      label: 'Кнопки',
      blocks: [ButtonBlock],
      required: false,
      admin: {
        description: 'Добавьте кнопки, которые будут прикреплены к этому сообщению. Если ButtonBlock используется внутри, его описание игнорируется.',
      },
    },
  ],
};

export default MessageBlock;
