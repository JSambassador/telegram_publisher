"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownConverter = void 0;
const marked_1 = require("marked");
const turndown_1 = __importDefault(require("turndown"));
class MarkdownConverter {
    constructor() {
        this.turndownService = new turndown_1.default({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced'
        });
    }
    toHtml(markdown) {
        return (0, marked_1.marked)(markdown);
    }
    toTelegramMarkdown(markdown) {
        // Basic markdown conversion for Telegram
        return markdown
            .replace(/^# (.+)$/gm, '*$1*') // Headers to bold
            .replace(/\*\*(.+?)\*\*/g, '*$1*') // Bold
            .replace(/`(.+?)`/g, '`$1`') // Code
            .replace(/^\s*[-*+] /gm, '• '); // Lists
    }
}
exports.MarkdownConverter = MarkdownConverter;
