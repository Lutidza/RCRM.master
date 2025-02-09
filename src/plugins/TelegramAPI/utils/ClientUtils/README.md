# README: Client Utilities in Telegram API Plugin

## Overview
The `ClientUtils` module within the Telegram API Plugin is designed to handle all client-related operations. This includes processing client records, managing client statuses (e.g., banned), and ensuring data consistency between Telegram bots and the Payload CMS. These utilities form the backbone of the system's client management, ensuring smooth interaction tracking and robust error handling.

## Features
### 1. Modular Architecture
- **Independent utilities**: Each function has a single responsibility, allowing for easier debugging and testing.
- **Reusability**: Functions are reusable across different parts of the plugin.
- **Scalability**: Modular design allows for seamless integration of new features.

### 2. Comprehensive Client Management
- Processes client records (`processClient`) and updates them in the `clients` collection.
- Ensures proper status handling, such as identifying and blocking banned clients (`bannedClientHook`).

### 3. Robust Error Handling
- Detailed error logging with the `Logger` utility.
- Graceful degradation ensures that unexpected errors do not disrupt bot functionality.

## Included Utilities
### 1. `processClient`
#### Description
Handles the creation and updating of client records in the Payload CMS `clients` collection.

#### Key Features
- Searches for a client by their Telegram ID (`telegram_id`).
- Updates or creates client records with relevant data:
  - `bots` field is updated to include the bot interacting with the client.
  - `total_visit` is incremented on each interaction.
  - Client details (`first_name`, `last_name`, `username`) are updated if necessary.
- Ensures data consistency and prevents unnecessary writes to the database.

#### Workflow
1. **Search for existing client**:
  - Queries the `clients` collection for a record matching the `telegram_id`.
  - If found, updates the record.
2. **Update bot associations**:
  - Ensures the current bot ID is included in the `bots` array.
  - Prevents duplicate bot entries.
3. **Increment visit count**:
  - Updates `total_visit` and `last_visit` fields.
  - Ensures other fields are updated only if they have changed.
4. **Create new client**:
  - Assigns default values (`enabled` status, `total_visit: 1`, etc.).
  - Ensures compliance with Payload CMS schema.

#### Function Signature
```typescript
async function processClient(
  payload: Payload,
  telegramId: number,
  botId: number,
  fromData: any
): Promise<any> {}
```

#### Key Considerations
- Prevents duplicate entries in the `clients` collection.
- Optimized for performance with indexed queries and minimal writes.

### 2. `bannedClientHook`
#### Description
Middleware for checking whether a client is banned. If a client is banned, the middleware:
- Sends a notification to the client.
- Clears their session.
- Stops further processing of the update.

#### Key Features
- Searches for the client in the `clients` collection by `telegram_id`.
- Checks the `status` field:
  - If the status alias is "banned", the client is blocked.
  - Supports both object and string representations of the `status` field.
- Logs important details about the client for debugging and monitoring.

#### Workflow
1. **Retrieve client record**:
  - Queries the `clients` collection for the client by `telegram_id`.
2. **Check client status**:
  - If the status alias is "banned", the client is identified as banned.
  - Sends a notification and clears the session.
3. **Continue processing**:
  - If the client is not banned, passes control to the next middleware.

#### Function Signature
```typescript
export function bannedClientHook(payload: Payload): Middleware<BotContext> {}
```

#### Key Considerations
- Designed as middleware for the `Grammy` framework.
- Extensible to support additional client restrictions or statuses.

## File Structure
```
src/
└── plugins/
    └── TelegramAPI/
        ├── utils/
        │   ├── ClientUtils/
        │   │   ├── processClient.ts        // Handles client processing
        │   │   ├── bannedClient.ts         // Checks for banned clients
        │   │   └── README.md               // Documentation for ClientUtils
        │   └── SystemUtils/
        │       └── Logger.ts              // Utility for logging
        ├── index.ts                        // Main Telegram API integration
```

## Example Usage
### 1. Integrating `processClient`
```typescript
import { processClient } from '@/plugins/TelegramAPI/utils/ClientUtils/processClient';

const client = await processClient(payload, telegramId, botId, fromData);
if (client.isBanned) {
  console.log('Client is banned');
}
```

### 2. Using `bannedClientHook` in the Bot Pipeline
```typescript
import { bannedClientHook } from '@/plugins/TelegramAPI/utils/ClientUtils/bannedClient';

bot.use(bannedClientHook(payload));
```

## Logging
### 1. Standardized Logging
The `Logger` utility (`src/plugins/TelegramAPI/utils/SystemUtils/Logger.ts`) is used across all utilities for consistent log formatting and output.

### 2. Log Examples
```
[2025-02-10T12:00:00.000Z] [INFO] Client processed successfully.
[2025-02-10T12:00:00.000Z] [ERROR] Failed to retrieve client record.
```

## Next Steps & Recommendations
### Enhance `bannedClientHook`
- Add support for temporary bans with expiration times.
- Notify admins when a client is banned.

### Expand `processClient`
- Add support for tracking additional client activities.
- Implement caching to reduce database load for frequently accessed clients.

### Centralized Configuration
- Move status aliases (e.g., "banned") to a configuration file for easier management.

## Version History
### Client Utilities
- **Version 1.0.0**: Initial implementation of `processClient`.
- **Version 1.0.6**: Improved bot association handling.
- **Version 1.1.2**: Enhanced error handling and logging.

### Banned Client Hook
- **Version 1.0.1**: Initial implementation.
- **Version 1.0.3**: Moved to `ClientUtils` and updated logging.

This document provides a comprehensive overview of client utilities in the Telegram API plugin. It serves as a starting point for developers working on client-related functionality.

