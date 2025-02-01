// Путь: src/blocks/TelegramAPI/MessageBlock/config.ts
// Версия: 1.2.0
//
// MessageBlock используется для отправки текстовых сообщений и/или медиа.
// Это базовый блок для вывода информации пользователю.
import type { Block } from 'payload';

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
    // Текст сообщения
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
  ],
};

export default MessageBlock;
