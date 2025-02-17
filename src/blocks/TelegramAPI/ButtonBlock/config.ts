// Путь: src/blocks/TelegramAPI/ButtonBlock/config.ts
// Версия: 1.3.1
//
// ButtonBlock используется для создания инлайн-кнопок в Telegram.
// Каждая кнопка имеет уникальный alias, текст, тип колбэка и дополнительные поля.
// Дополнительные функции:
// - newRow: если установлено, кнопка выводится на новой строке.
// - callbackType: выбор типа колбэка с вариантами:
//    • message – вернуть сообщение
//    • layout – открыть лейаут
//    • command – выполнить команду
//    • link – открыть внешнюю ссылку
// В зависимости от callbackType используются поля callback_data или url.
import type { Block } from 'payload';

const ButtonBlock: Block = {
  slug: 'button-blocks',
  interfaceName: 'ButtonBlock',
  labels: {
    singular: 'Button Block',
    plural: 'Button Blocks',
  },
  fields: [
    // Скрытое поле для типа блока
    {
      name: 'blockType',
      type: 'text',
      defaultValue: 'ButtonBlock',
      admin: { hidden: true },
    },
    // Массив кнопок
    {
      name: 'buttons',
      type: 'array',
      labels: {
        singular: 'Button',
        plural: 'Buttons',
      },
      fields: [
        // Alias кнопки – уникальный идентификатор для вызова
        {
          name: 'alias',
          type: 'text',
          required: true,
          label: 'Alias кнопки',
          admin: {
            description:
              'Введите уникальный идентификатор кнопки. Пример: "next" для вызова лейаута с alias "next".',
          },
        },
        // Текст кнопки
        {
          name: 'text',
          type: 'text',
          required: true,
          label: 'Текст кнопки',
          admin: {
            description: 'Введите текст, который будет отображаться на кнопке (например, "Next").',
          },
        },
        // Выбор типа колбэка для кнопки
        {
          name: 'callbackType',
          type: 'select',
          required: true,
          label: 'Тип колбэка',
          options: [
            { label: 'Вернуть сообщение', value: 'message' },
            { label: 'Открыть лейаут', value: 'layout' },
            { label: 'Команда', value: 'command' },
            { label: 'Внешняя ссылка', value: 'link' },
          ],
          defaultValue: 'message',
          admin: {
            description:
              'Выберите тип колбэка для кнопки. "Вернуть сообщение" – бот отправит указанное сообщение; "Открыть лейаут" – бот откроет лейаут по alias; "Команда" – бот выполнит команду; "Внешняя ссылка" – кнопка перейдёт по указанному URL.',
          },
        },
        // Callback Data – значение для типов "message", "layout" или "command"
        {
          name: 'callback_data',
          type: 'text',
          required: true,
          label: 'Callback Data',
          admin: {
            description:
              'Введите значение для колбэка. Если выбран тип "Вернуть сообщение", "Открыть лейаут" или "Команда", укажите alias (например, "next").',
          },
        },
        // URL – используется, если выбран тип "Внешняя ссылка"
        {
          name: 'url',
          type: 'text',
          required: true,
          label: 'Внешняя ссылка',
          admin: {
            condition: (_, { callbackType }) => callbackType === 'link',
            description:
              'Если выбран тип "Внешняя ссылка", введите полный URL, например, "https://example.com".',
          },
        },
        // Флаг, указывающий, что данная кнопка должна начинать новую строку
        {
          name: 'newRow',
          type: 'checkbox',
          defaultValue: false,
          label: 'Новая строка',
          admin: {
            description:
              'Если установлено, эта кнопка будет выведена на новой строке, отделяя группы кнопок.',
          },
        },
      ],
    },
  ],
};

export default ButtonBlock;
