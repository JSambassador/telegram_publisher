import { TelegramPublisher } from '../publisher';
import { PublisherConfig } from '../types';
import { createLogger } from '../logger';
import fs from 'fs';
import path from 'path';

jest.mock('telegraf');
jest.mock('fs');
jest.mock('path');

describe('TelegramPublisher', () => {
    let publisher: TelegramPublisher;
    let logger: ReturnType<typeof createLogger>;
    
    const mockConfig: PublisherConfig = {
        maxLength: 1000,
        defaultChannel: '@testChannel',
        botToken: 'mock-token',
        obsidianVaultPath: '/mock/path',
        scheduledPostsPath: '/mock/scheduled',
        logLevel: 'error'
    };

    beforeEach(() => {
        logger = createLogger('error');
        publisher = new TelegramPublisher(mockConfig, logger);
    });

    describe('parseMarkdownFile', () => {
        it('should parse markdown file with frontmatter', async () => {
            const mockContent = `---
title: Test Post
tags: [test, markdown]
channel: @customChannel
attachments: [image.jpg, doc.pdf]
---
Test content`;

            (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);

            const result = await publisher.parseMarkdownFile('test.md');

            expect(result).toEqual({
                content: 'Test content',
                filepath: 'test.md',
                metadata: {
                    title: 'Test Post',
                    tags: ['test', 'markdown'],
                    channel: '@customChannel',
                    attachments: ['image.jpg', 'doc.pdf']
                }
            });
        });

        it('should use default values when frontmatter is missing', async () => {
            const mockContent = 'Test content';
            (fs.readFileSync as jest.Mock).mockReturnValue(mockContent);
            (path.basename as jest.Mock).mockReturnValue('test.md');

            const result = await publisher.parseMarkdownFile('test.md');

            expect(result.metadata).toEqual({
                title: 'test',
                tags: [],
                channel: '@testChannel',
                attachments: []
            });
        });
    });

    describe('content validation', () => {
        it('should validate post length correctly', () => {
            const validPost = {
                content: 'Test content',
                filepath: 'test.md',
                metadata: { title: 'Test' }
            };

            expect(() => publisher.validatePost(validPost)).not.toThrow();

            const invalidPost = {
                content: 'a'.repeat(1001),
                filepath: 'test.md',
                metadata: { title: 'Test' }
            };

            expect(() => publisher.validatePost(invalidPost)).toThrow();
        });

        it('should handle markdown conversion in length validation', () => {
            const postWithMarkdown = {
                content: '# Heading\n\n**Bold text**\n\n```code block```',
                filepath: 'test.md',
                metadata: { title: 'Test' }
            };

            expect(() => publisher.validatePost(postWithMarkdown)).not.toThrow();
        });
    });

    describe('media handling', () => {
        it('should handle missing attachments gracefully', async () => {
            const post = {
                content: 'Test content',
                filepath: 'test.md',
                metadata: {
                    title: 'Test',
                    attachments: ['missing.jpg']
                }
            };

            (fs.existsSync as jest.Mock).mockReturnValue(false);

            await expect(publisher.publishPost(post)).resolves.not.toThrow();
        });

        it('should detect mime types correctly', () => {
            const publisher = new TelegramPublisher(mockConfig, logger);
            
            // @ts-ignore - accessing private method for testing
            expect(publisher.getMimeType('test.jpg')).toBe('image');
            // @ts-ignore - accessing private method for testing
            expect(publisher.getMimeType('test.mp4')).toBe('video');
            // @ts-ignore - accessing private method for testing
            expect(publisher.getMimeType('test.mp3')).toBe('audio');
            // @ts-ignore - accessing private method for testing
            expect(publisher.getMimeType('test.pdf')).toBe('document');
        });
    });

    describe('markdown conversion', () => {
        it('should convert markdown to Telegram-compatible format', async () => {
            const post = {
                content: '# Heading\n\n**Bold text**\n\n```code```',
                filepath: 'test.md',
                metadata: { title: 'Test' }
            };

            await publisher.publishPost(post);

            // Cast to access private members
            expect((publisher as any).bot.telegram.sendMessage).toHaveBeenCalledWith(
                expect.any(String),
                expect.stringContaining('*Heading*\n\n**Bold text**\n\n`code`'),
                expect.any(Object)
            );
        });
    });
});