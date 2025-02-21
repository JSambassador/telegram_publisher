"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const publisher_1 = require("../publisher");
const logger_1 = require("../logger");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
jest.mock('telegraf');
jest.mock('fs');
jest.mock('path');
describe('TelegramPublisher', () => {
    let publisher;
    let logger;
    const mockConfig = {
        maxLength: 1000,
        defaultChannel: '@testChannel',
        botToken: 'mock-token',
        obsidianVaultPath: '/mock/path',
        scheduledPostsPath: '/mock/scheduled',
        logLevel: 'error'
    };
    beforeEach(() => {
        logger = (0, logger_1.createLogger)('error');
        publisher = new publisher_1.TelegramPublisher(mockConfig, logger);
    });
    describe('parseMarkdownFile', () => {
        it('should parse markdown file with frontmatter', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockContent = `---
title: Test Post
tags: [test, markdown]
channel: @customChannel
attachments: [image.jpg, doc.pdf]
---
Test content`;
            fs_1.default.readFileSync.mockReturnValue(mockContent);
            const result = yield publisher.parseMarkdownFile('test.md');
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
        }));
        it('should use default values when frontmatter is missing', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockContent = 'Test content';
            fs_1.default.readFileSync.mockReturnValue(mockContent);
            path_1.default.basename.mockReturnValue('test.md');
            const result = yield publisher.parseMarkdownFile('test.md');
            expect(result.metadata).toEqual({
                title: 'test',
                tags: [],
                channel: '@testChannel',
                attachments: []
            });
        }));
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
        it('should handle missing attachments gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            const post = {
                content: 'Test content',
                filepath: 'test.md',
                metadata: {
                    title: 'Test',
                    attachments: ['missing.jpg']
                }
            };
            fs_1.default.existsSync.mockReturnValue(false);
            yield expect(publisher.publishPost(post)).resolves.not.toThrow();
        }));
        it('should detect mime types correctly', () => {
            const publisher = new publisher_1.TelegramPublisher(mockConfig, logger);
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
        it('should convert markdown to Telegram-compatible format', () => __awaiter(void 0, void 0, void 0, function* () {
            const post = {
                content: '# Heading\n\n**Bold text**\n\n```code```',
                filepath: 'test.md',
                metadata: { title: 'Test' }
            };
            yield publisher.publishPost(post);
            // Cast to access private members
            expect(publisher.bot.telegram.sendMessage).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('*Heading*\n\n**Bold text**\n\n`code`'), expect.any(Object));
        }));
    });
});
