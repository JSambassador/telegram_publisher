# Obsidian to Telegram Publisher

A TypeScript application that publishes Markdown files from Obsidian to Telegram channels with scheduling capabilities.

## Features

- Parse Obsidian Markdown files with frontmatter
- Validate post length
- Schedule posts for future publication
- Configure multiple Telegram channels
- Automated tests

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your settings in `.env`:
   ```
   BOT_TOKEN=your_telegram_bot_token
   DEFAULT_CHANNEL=@your_channel
   MAX_LENGTH=4096
   OBSIDIAN_VAULT_PATH=/path/to/vault
   SCHEDULED_POSTS_PATH=/path/to/scheduled
   ```

## Usage

### Direct Publishing
```typescript
const publisher = new TelegramPublisher(config);
await publisher.publishPost(post);
```

### Scheduled Publishing
```typescript
const scheduledTime = new Date('2025-02-12T15:00:00Z');
await publisher.schedulePost(post, scheduledTime);
```

### Start Scheduler
```typescript
const scheduler = new PostScheduler(publisher);
scheduler.start();
```

## Development

- Build: `npm run build`
- Test: `npm test`
- Watch mode: `npm run watch`

## License

MIT