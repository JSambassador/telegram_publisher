// src/index.ts
import dotenv from 'dotenv';
import { TelegramPublisher } from './publisher';
import { PostScheduler } from './scheduler';
import { createLogger } from './logger';
import { validateConfig } from './config';
import path from 'path';
import { PublisherConfig } from './types';

// Load environment variables
dotenv.config();

// Configuration
const config = validateConfig({
    maxLength: parseInt(process.env.MAX_LENGTH || '4096', 10),
    defaultChannel: process.env.DEFAULT_CHANNEL,
    botToken: process.env.BOT_TOKEN,
    obsidianVaultPath: process.env.OBSIDIAN_VAULT_PATH,
    scheduledPostsPath: process.env.SCHEDULED_POSTS_PATH,
    logLevel: process.env.LOG_LEVEL || 'info'
});

// Initialize logger
const logger = createLogger(config.logLevel);

// Initialize publisher
const publisher = new TelegramPublisher(config, logger);

// Initialize scheduler
const scheduler = new PostScheduler(publisher);

// Start scheduler
scheduler.start();

// Export for programmatic usage
export { publisher, scheduler };

export { createLogger };
export type { PublisherConfig };

// Re-export other types that might be needed
export * from './types';

export { cli } from './examples/cli';