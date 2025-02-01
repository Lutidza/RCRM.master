// Путь: src/collections/TelegramAPI/Bots/index.ts
// Версия: 3.1.1
//
// Коллекция Bots содержит настройки каждого бота: имя, токен, описание (для обновления в Telegram),
// флаг активности, статус инициализации и настройки интерфейса. В группе "interface" задаются блоки
// (используется тип "blocks") и дефолтные alias для лейаутов. Связь с коллекцией Clients осуществляется
// через стандартное числовое поле id (автоинкрементное).

import MessageBlock from '@/blocks/TelegramAPI/MessageBlock/config';
import ButtonBlock from '@/blocks/TelegramAPI/ButtonBlock/config';
import LayoutBlock from '@/blocks/TelegramAPI/LayoutBlock/config';
import CommandBlock from '@/blocks/TelegramAPI/CommandBlock/config';

import type { CollectionConfig } from 'payload';

const Bots: CollectionConfig = {
  slug: 'bots',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    // Имя бота (для отображения в админке)
    {
      name: 'name',
      label: 'Bot Name',
      type: 'text',
      required: true,
    },
    // Токен Telegram-бота
    {
      name: 'token',
      label: 'Telegram Bot Token',
      type: 'text',
      required: true,
    },
    // Описание бота – если изменено, обновляется в Telegram через setMyDescription
    {
      name: 'description',
      type: 'text',
      required: false,
      admin: {
        description: 'Введите описание бота (например, "CRM Connector Bot для управления заказами").',
      },
    },
    // Флаг активности бота
    {
      name: 'enabled',
      type: 'checkbox',
      defaultValue: false,
      required: true,
      label: 'Включён',
    },
    // Статус инициализации (Not Initialized, Initialized, Error)
    {
      name: 'initialization_status',
      type: 'select',
      options: [
        { label: 'Not Initialized', value: 'Not Initialized' },
        { label: 'Initialized', value: 'Initialized' },
        { label: 'Error', value: 'Error' },
      ],
      defaultValue: 'Not Initialized',
      required: true,
      label: 'Статус инициализации',
    },
    // Дата последней инициализации
    {
      name: 'last_initialized',
      type: 'date',
      required: false,
      label: 'Дата последней инициализации',
    },
    // Группа настроек интерфейса бота: здесь задаются блоки и дефолтные alias для лейаутов.
    {
      name: 'interface',
      type: 'group',
      label: 'Bot Interface',
      admin: {
        description:
            'Настройки интерфейса: добавьте блоки (Message, Button, Layout, Command) и укажите дефолтные alias для лейаутов, например, "start" и "start_first_visit".',
      },
      fields: [
        {
          name: 'blocks',
          type: 'blocks',
          blocks: [
            MessageBlock,
            ButtonBlock,
            LayoutBlock,
            CommandBlock,
          ],
        },
        {
          name: 'defaultStartLayout',
          type: 'text',
          defaultValue: 'start',
          required: true,
          label: 'Стартовый лейаут (Alias)',
          admin: {
            description: 'Alias лейаута для повторного визита. Пример: "start".',
          },
        },
        {
          name: 'defaultFirstVisitLayout',
          type: 'text',
          defaultValue: 'start_first_visit',
          required: true,
          label: 'Лейаут для новых пользователей (Alias)',
          admin: {
            description: 'Alias лейаута для первого визита. Пример: "start_first_visit".',
          },
        },
      ],
    },
  ],
};

export default Bots;
