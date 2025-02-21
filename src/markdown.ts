import { marked } from 'marked';
import TurndownService from 'turndown';

export class MarkdownConverter {
    private turndownService: TurndownService;

    constructor() {
        this.turndownService = new TurndownService({
            headingStyle: 'atx',
            codeBlockStyle: 'fenced'
        });
    }

    toHtml(markdown: string): string {
        return marked(markdown);
    }

    toTelegramMarkdown(markdown: string): string {
        // Basic markdown conversion for Telegram
        return markdown
            .replace(/^# (.+)$/gm, '*$1*')        // Headers to bold
            .replace(/\*\*(.+?)\*\*/g, '*$1*')    // Bold
            .replace(/`(.+?)`/g, '`$1`')          // Code
            .replace(/^\s*[-*+] /gm, '• ');       // Lists
    }
}