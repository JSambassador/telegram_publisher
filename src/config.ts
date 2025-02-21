// src/config.ts
import { z } from 'zod';
import { PublisherConfig } from './types';

const configSchema = z.object({
    maxLength: z.number().min(1).max(4096),
    defaultChannel: z.string(),
    botToken: z.string(),
    obsidianVaultPath: z.string(),
    scheduledPostsPath: z.string(),
    logLevel: z.string()
});

export function validateConfig(config: Partial<PublisherConfig>): PublisherConfig {
    if (!config.botToken) {
        throw new Error('BOT_TOKEN is required');
    }
    if (!config.defaultChannel) {
        throw new Error('DEFAULT_CHANNEL is required');
    }
    if (!config.obsidianVaultPath) {
        throw new Error('OBSIDIAN_VAULT_PATH is required');
    }
    if (!config.scheduledPostsPath) {
        throw new Error('SCHEDULED_POSTS_PATH is required');
    }

    const result = configSchema.safeParse(config);
    
    if (!result.success) {
        throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    return result.data;
}