import { Logger } from 'winston';

export interface Post {
    content: string;
    scheduledTime?: Date;
    filepath: string;
    metadata: {
        title: string;
        tags?: string[];
        channel?: string;
        attachments?: string[]; // Paths to media files
    };
}

export interface PublisherConfig {
    maxLength: number;
    defaultChannel: string;
    botToken: string;
    obsidianVaultPath: string;
    scheduledPostsPath: string;
    logLevel: string;
}