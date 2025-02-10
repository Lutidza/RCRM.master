# README: Client Utilities in Telegram API Plugin

## Overview
The `ClientUtils` module within the Telegram API Plugin is designed to handle all client-related operations. This includes processing client records, managing client statuses (e.g., banned), and ensuring data consistency between Telegram bots and the Payload CMS. These utilities form the backbone of the system's client management, ensuring smooth interaction tracking and robust error handling.

## Features

### 1. Modular Architecture
- **Independent utilities**: Each function has a single responsibility, allowing for easier debugging and testing.
- **Reusability**: Functions are reusable across different parts of the plugin.
- **Scalability**: Modular design allows for seamless integration of new features.

### 2. Comprehensive Client Management
- **Client Processing**: The `processClient` function handles the creation and updating of client records in the Payload CMS `clients` collection.
  - It searches for a client by their Telegram ID (`telegram_id`).
  - Updates or creates client records with relevant data:
    - The `bots` field is updated to include the bot interacting with the client.
    - The `total_visit` is incremented and `last_visit` is updated on each interaction.
    - Client details (`first_name`, `last_name`, `user_name`) are updated if necessary.
  - **Default Status Handling**: Unlike previous implementations, the `processClient` function no longer explicitly passes a value for the `status` field when creating a new client.
    This allows the default status to be set automatically on the collection side (via a webhook or a beforeChange hook). If the field remains empty, the system (and the `checkClientStatus` utility) will interpret it as `"new"`.
- **Status Handling**: The `checkClientStatus` function retrieves the alias of the client's status. If no status is populated (or if the field is null/undefined), it returns `"new"` by default.
- **Banned Client Handling**: The `bannedClientHook` middleware checks whether a client is banned. It first looks at a session flag (`isBanned`); if not set, it queries the client’s status via `checkClientStatus`. If the alias is `"banned"`, it sends a notification to the client and stops further processing.

### 3. Robust Error Handling
- Detailed error logging is provided via the `Logger` utility.
- Graceful degradation ensures that unexpected errors do not disrupt bot functionality.

## Included Utilities

### 1. `processClient`
#### Description
Handles the creation and updating of client records in the Payload CMS `clients` collection.
**Note:** When creating a new client, the `status` field is not sent in the data so that the collection’s hook (or webhook) can automatically assign a default status.

#### Key Features
- Searches for an existing client using the `telegram_id`.
- Updates the client’s data (including normalizing the `bots` field and incrementing `total_visit`).
- If no client is found, creates a new record without explicitly setting `status`.
- Uses `checkClientStatus` to retrieve the status alias and sets a flag (`isBanned`) on the client object if needed.

#### Function Signature
```typescript
async function processClient(
  payload: Payload,
  telegramId: number,
  botId: number,
  fromData: any
): Promise<any> {}
```

### 2. `checkClientStatus`
#### Description
Retrieves the alias of the client’s status from the status field.

- If the field is not populated (null/undefined), returns `"new"` by default.
- Supports both populated objects (with an alias field) and raw IDs (numbers or strings).

#### Function Signature
```typescript
async function checkClientStatus(
  payload: Payload,
  status: any
): Promise<string | null> {}
```

### 3. `bannedClientHook`
#### Description
Middleware that checks whether a client is banned.

- First, it checks the session flag `isBanned`.
- If not set, it queries the client’s status via `checkClientStatus`.
- If the status alias equals `"banned"`, it sends a notification to the client, clears the session, and halts further processing.

#### Function Signature
```typescript
export function bannedClientHook(payload: Payload): Middleware<BotContext> {}
```

## File Structure
```
src/
└── plugins/
    └── TelegramAPI/
        ├── utils/
        │   ├── BlockUtils/
        │   ├── BotUtils/
        │   ├── ClientUtils/
        │   │   ├── bannedClient.ts        // Middleware for banned client check
        │   │   ├── checkClientStatus.ts   // Retrieves the status alias
        │   │   ├── processClient.ts       // Handles client creation/updating
        │   │   └── README.md              // Documentation for ClientUtils
        │   ├── SystemUtils/
        │   └── index.TelegramAPI.ts       // Main Telegram API integration
```

## Example Usage

### 1. Processing a Client
```typescript
import { processClient } from '@/plugins/TelegramAPI/utils/ClientUtils/processClient';

const client = await processClient(payload, telegramId, botId, fromData);
if (client.isBanned) {
  console.log('Client is banned');
}
```

### 2. Using the Banned Client Hook in the Bot Pipeline
```typescript
import { bannedClientHook } from '@/plugins/TelegramAPI/utils/ClientUtils/bannedClient';

bot.use(bannedClientHook(payload));
```

## Logging

### 1. Standardized Logging
The `Logger` utility (`src/plugins/TelegramAPI/utils/SystemUtils/Logger.ts`) is used across all modules for consistent log formatting and output.

### 2. Log Examples
```
[INFO] Client processed successfully.
[ERROR] Failed to retrieve client record.
```

## Next Steps & Recommendations

### Enhance `bannedClientHook`
- Consider adding support for temporary bans with expiration times.
- Optionally notify administrators when a client is banned.

### Expand `processClient`
- Integrate additional client activity tracking as needed.
- Consider implementing caching to reduce database load for frequently accessed client records.

### Centralized Configuration
- Extract status aliases (e.g., `"banned"`, `"new"`) into a centralized configuration file for easier management.

## Version History

### Client Utilities
- **Version 1.0.0**: Initial implementation of `processClient`.
- **Version 1.0.6**: Improved bot association handling.
- **Version 1.1.2**: Enhanced error handling and logging.
- **Version 1.3.5**: Added default status handling via collection hooks.
- **Version 1.3.8**: Updated client creation to omit the status field, allowing default assignment.

### Banned Client Hook
- **Version 1.0.1**: Initial implementation.
- **Version 1.0.3**: Integrated with client processing and updated logging.
- **Version 1.2.3**: Unified ban checking logic.

