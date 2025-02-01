// Путь: src/collections/TelegramAPI/Clients/index.ts
// Версия: 3.2.0
//
// Коллекция Clients хранит информацию о пользователях Telegram, связанных с ботами.
// Связь реализована через поле отношения "bots", которое ссылается на коллекцию Bots.
// Один клиент может быть привязан к нескольким ботам.
import type { CollectionConfig } from 'payload';

const Clients: CollectionConfig = {
  slug: 'clients',
  admin: {
    useAsTitle: 'telegram_id',
  },
  fields: [
    // Telegram ID пользователя (число)
    {
      name: 'telegram_id',
      type: 'number',
      required: true,
      label: 'Telegram ID (число)',
    },
    // Отношение к ботам: массив (hasMany: true)
    {
      name: 'bots',
      type: 'relationship',
      relationTo: 'bots',
      hasMany: true,
      required: true,
      label: 'Связанные боты',
      admin: {
        description: 'Выберите ботов из коллекции Bots, с которыми связан данный клиент.',
      },
    },
    // Имя пользователя
    {
      name: 'first_name',
      type: 'text',
      label: 'Имя',
    },
    // Фамилия пользователя
    {
      name: 'last_name',
      type: 'text',
      label: 'Фамилия',
    },
    // Никнейм (username)
    {
      name: 'user_name',
      type: 'text',
      label: 'Никнейм (username)',
    },
    // Дата последнего визита
    {
      name: 'last_visit',
      type: 'date',
      label: 'Дата последнего визита',
    },
    // Общее количество визитов
    {
      name: 'total_visit',
      type: 'number',
      defaultValue: 0,
      required: true,
      label: 'Общее количество посещений',
      admin: {
        description:
            'Общее количество посещений этим клиентом. При первом визите устанавливается 1, при повторном – можно увеличить.',
      },
    },
    // Статус клиента (new, active, banned)
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Active', value: 'active' },
        { label: 'Banned', value: 'banned' },
      ],
      defaultValue: 'new',
      required: true,
      label: 'Статус клиента',
      admin: {
        description: 'Статус клиента. "new" – новый, "active" – активный, "banned" – заблокирован.',
      },
    },
  ],
};

export default Clients;
