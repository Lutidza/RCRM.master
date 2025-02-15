// Path: src/plugins/TelegramAPI/index.TelegramAPI.ts
// Version: 5.7.1-refactored
// Подробные комментарии в коде:
// - Этот файл отвечает за подключение плагина TelegramAPI к Payload CMS.
// - Ранее использовалась функция initializeBots для инициализации ботов,
//   теперь импортируется и вызывается функция registerBots из файла registerBots.ts.

import type { Payload, Config, Plugin } from 'payload';
import Bots from '@/collections/TelegramAPI/Bots';
import Clients from '@/collections/TelegramAPI/Clients';
import { registerBots } from '@/plugins/TelegramAPI/utils/BotUtils/registerBots';
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
      await registerBots(payload);
      log('info', 'TelegramAPIPlugin registered successfully.', payload);
    },
  };
};

export default TelegramAPIPlugin;
