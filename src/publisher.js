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
exports.TelegramPublisher = void 0;
// src/publisher.
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const telegraf_1 = require("telegraf");
const gray_matter_1 = __importDefault(require("gray-matter"));
const markdown_1 = require("./markdown");
class TelegramPublisher {
    constructor(config, logger) {
        this.config = config;
        this.bot = new telegraf_1.Telegraf(config.botToken);
        this.logger = logger;
        this.markdownConverter = new markdown_1.MarkdownConverter();
    }
    parseMarkdownFile(filepath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`Parsing markdown file: ${filepath}`);
            const fileContent = fs_1.default.readFileSync(filepath, 'utf-8');
            const { data, content } = (0, gray_matter_1.default)(fileContent);
            return {
                content,
                filepath,
                metadata: {
                    title: data.title || path_1.default.basename(filepath, '.md'),
                    tags: data.tags || [],
                    channel: data.channel || this.config.defaultChannel,
                    attachments: data.attachments || []
                }
            };
        });
    }
    validatePost(post) {
        const convertedContent = this.markdownConverter.toTelegramMarkdown(post.content);
        if (convertedContent.length > this.config.maxLength) {
            const error = `Post exceeds maximum length of ${this.config.maxLength} characters`;
            this.logger.error(error, { postTitle: post.metadata.title });
            throw new Error(error);
        }
        return true;
    }
    publishPost(post) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.info(`Publishing post: ${post.metadata.title}`);
            this.validatePost(post);
            const convertedContent = this.markdownConverter.toTelegramMarkdown(post.content);
            const formattedContent = `${post.metadata.title}\n\n${convertedContent}`;
            try {
                // Send text content
                yield this.bot.telegram.sendMessage(post.metadata.channel || this.config.defaultChannel, formattedContent, { parse_mode: 'Markdown' });
                // Send attachments if any
                if (post.metadata.attachments && post.metadata.attachments.length > 0) {
                    yield this.sendAttachments(post.metadata.channel || this.config.defaultChannel, post.metadata.attachments);
                }
                this.logger.info(`Successfully published post: ${post.metadata.title}`);
            }
            catch (error) {
                this.logger.error('Failed to publish post', {
                    error,
                    postTitle: post.metadata.title
                });
                throw error;
            }
        });
    }
    sendAttachments(channel, attachments) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const attachment of attachments) {
                try {
                    const filePath = path_1.default.join(this.config.obsidianVaultPath, attachment);
                    const mimeType = this.getMimeType(filePath);
                    if (!fs_1.default.existsSync(filePath)) {
                        this.logger.error(`Attachment not found: ${filePath}`);
                        continue;
                    }
                    const file = { source: fs_1.default.createReadStream(filePath) };
                    switch (mimeType) {
                        case 'image':
                            yield this.bot.telegram.sendPhoto(channel, file);
                            break;
                        case 'video':
                            yield this.bot.telegram.sendVideo(channel, file);
                            break;
                        case 'audio':
                            yield this.bot.telegram.sendAudio(channel, file);
                            break;
                        default:
                            yield this.bot.telegram.sendDocument(channel, file);
                    }
                    this.logger.info(`Successfully sent attachment: ${attachment}`);
                }
                catch (error) {
                    this.logger.error(`Failed to send attachment: ${attachment}`, { error });
                }
            }
        });
    }
    getMimeType(filePath) {
        const ext = path_1.default.extname(filePath).toLowerCase();
        const imageExts = ['.jpg', '.jpeg', '.png', '.gif'];
        const videoExts = ['.mp4', '.avi', '.mov'];
        const audioExts = ['.mp3', '.wav', '.ogg'];
        if (imageExts.includes(ext))
            return 'image';
        if (videoExts.includes(ext))
            return 'video';
        if (audioExts.includes(ext))
            return 'audio';
        return 'document';
    }
    schedulePost(post, scheduledTime) {
        return __awaiter(this, void 0, void 0, function* () {
            this.validatePost(post);
            const scheduledPost = Object.assign(Object.assign({}, post), { scheduledTime });
            fs_1.default.writeFileSync(path_1.default.join(this.config.scheduledPostsPath, `${Date.now()}.json`), JSON.stringify(scheduledPost));
        });
    }
    processScheduledPosts() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const scheduledPosts = fs_1.default.readdirSync(this.config.scheduledPostsPath)
                .filter(file => file.endsWith('.json'))
                .map(file => {
                const content = fs_1.default.readFileSync(path_1.default.join(this.config.scheduledPostsPath, file), 'utf-8');
                return JSON.parse(content);
            })
                .filter(post => {
                const scheduledTime = new Date(post.scheduledTime);
                return scheduledTime <= now;
            });
            for (const post of scheduledPosts) {
                yield this.publishPost(post);
                fs_1.default.unlinkSync(path_1.default.join(this.config.scheduledPostsPath, `${post.filepath}.json`));
            }
        });
    }
}
exports.TelegramPublisher = TelegramPublisher;
