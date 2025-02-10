// Path: src/plugins/TelegramAPI/index.ts
// Version: 5.7.0
// Рефакторинг: Используется единая логика инициализации ботов из файла initializeBots.ts.
// Коллекции Bots и Clients регистрируются в плагине.
import type { Payload, Config, Plugin } from 'payload';
import Bots from '@/collections/TelegramAPI/Bots';
import Clients from '@/collections/TelegramAPI/Clients';
import { initializeBots } from '@/plugins/TelegramAPI/utils/BotUtils/initializeBots';
import { log } from '@/plugins/TelegramAPI/utils/SystemUtils/Logger';

const TelegramAPIPlugin: Plugin = (incomingConfig: Config): Config => {
  return {
    ...incomingConfig,
    collections: [
      ...(incomingConfig.collections || []),
      Bots,
      Clients,
    ],
    onInit: async (payload: Payload) => {
      log('info', 'TelegramAPIPlugin initialization started.', payload);
      await initializeBots(payload);
      log('info', 'TelegramAPIPlugin initialized successfully.', payload);
    },
  };
};

export default TelegramAPIPlugin;
