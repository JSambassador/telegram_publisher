// src/publisher.
import fs from 'fs';
import path from 'path';
import { Telegraf } from 'telegraf';
import matter from 'gray-matter';
import { Post, PublisherConfig } from './types';
import { Logger } from 'winston';
import { MarkdownConverter } from './markdown';

export class TelegramPublisher {
    private bot: Telegraf;
    private config: PublisherConfig;
    private logger: Logger;
    private markdownConverter: MarkdownConverter;

    constructor(config: PublisherConfig, logger: Logger) {
        this.config = config;
        this.bot = new Telegraf(config.botToken);
        this.logger = logger;
        this.markdownConverter = new MarkdownConverter();
    }

    async parseMarkdownFile(filepath: string): Promise<Post> {
        this.logger.info(`Parsing markdown file: ${filepath}`);
        const fileContent = fs.readFileSync(filepath, 'utf-8');
        const { data, content } = matter(fileContent);

        return {
            content,
            filepath,
            metadata: {
                title: data.title || path.basename(filepath, '.md'),
                tags: data.tags || [],
                channel: data.channel || this.config.defaultChannel,
                attachments: data.attachments || []
            }
        };
    }

    validatePost(post: Post): boolean {
        const convertedContent = this.markdownConverter.toTelegramMarkdown(post.content);
        if (convertedContent.length > this.config.maxLength) {
            const error = `Post exceeds maximum length of ${this.config.maxLength} characters`;
            this.logger.error(error, { postTitle: post.metadata.title });
            throw new Error(error);
        }
        return true;
    }

    async publishPost(post: Post): Promise<void> {
        this.logger.info(`Publishing post: ${post.metadata.title}`);
        this.validatePost(post);
        
        const convertedContent = this.markdownConverter.toTelegramMarkdown(post.content);
        const formattedContent = `${post.metadata.title}\n\n${convertedContent}`;
        
        try {
            // Send text content
            await this.bot.telegram.sendMessage(
                post.metadata.channel || this.config.defaultChannel,
                formattedContent,
                { parse_mode: 'Markdown' }
            );

            // Send attachments if any
            if (post.metadata.attachments && post.metadata.attachments.length > 0) {
                await this.sendAttachments(
                    post.metadata.channel || this.config.defaultChannel,
                    post.metadata.attachments
                );
            }

            this.logger.info(`Successfully published post: ${post.metadata.title}`);
        } catch (error) {
            this.logger.error('Failed to publish post', {
                error,
                postTitle: post.metadata.title
            });
            throw error;
        }
    }

    private async sendAttachments(channel: string, attachments: string[]): Promise<void> {
        for (const attachment of attachments) {
            try {
                const filePath = path.join(this.config.obsidianVaultPath, attachment);
                const mimeType = this.getMimeType(filePath);
                
                if (!fs.existsSync(filePath)) {
                    this.logger.error(`Attachment not found: ${filePath}`);
                    continue;
                }

                const file = { source: fs.createReadStream(filePath) };

                switch (mimeType) {
                    case 'image':
                        await this.bot.telegram.sendPhoto(channel, file);
                        break;
                    case 'video':
                        await this.bot.telegram.sendVideo(channel, file);
                        break;
                    case 'audio':
                        await this.bot.telegram.sendAudio(channel, file);
                        break;
                    default:
                        await this.bot.telegram.sendDocument(channel, file);
                }

                this.logger.info(`Successfully sent attachment: ${attachment}`);
            } catch (error) {
                this.logger.error(`Failed to send attachment: ${attachment}`, { error });
            }
        }
    }

    private getMimeType(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif'];
        const videoExts = ['.mp4', '.avi', '.mov'];
        const audioExts = ['.mp3', '.wav', '.ogg'];

        if (imageExts.includes(ext)) return 'image';
        if (videoExts.includes(ext)) return 'video';
        if (audioExts.includes(ext)) return 'audio';
        return 'document';
    }

    async schedulePost(post: Post, scheduledTime: Date): Promise<void> {
        this.validatePost(post);
        const scheduledPost = { ...post, scheduledTime };
        
        fs.writeFileSync(
            path.join(this.config.scheduledPostsPath, `${Date.now()}.json`),
            JSON.stringify(scheduledPost)
        );
    }

    async processScheduledPosts(): Promise<void> {
        const now = new Date();
        const scheduledPosts = fs.readdirSync(this.config.scheduledPostsPath)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const content = fs.readFileSync(
                    path.join(this.config.scheduledPostsPath, file),
                    'utf-8'
                );
                return JSON.parse(content) as Post;
            })
            .filter(post => {
                const scheduledTime = new Date(post.scheduledTime!);
                return scheduledTime <= now;
            });

        for (const post of scheduledPosts) {
            await this.publishPost(post);
            fs.unlinkSync(path.join(
                this.config.scheduledPostsPath,
                `${post.filepath}.json`
            ));
        }
    }
}