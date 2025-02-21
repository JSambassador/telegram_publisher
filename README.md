## Features

- Parse Obsidian Markdown files with frontmatter
- Convert Markdown to Telegram-compatible format
- Support for media attachments (images, videos, audio, documents)
- Validate post length
- Schedule posts for future publication
- Configure multiple Telegram channels
- Comprehensive logging
- Automated tests

## Media Support

The publisher supports the following media types:
- Images: .jpg, .jpeg, .png, .gif
- Videos: .mp4, .avi, .mov
- Audio: .mp3, .wav, .ogg
- Documents: all other file types

Add attachments in the frontmatter:
```yaml
---
title: My Post
attachments:
  - images/photo.jpg
  - documents/report.pdf
---
```

## Logging

Logs are written to:
- `error.log`: Error-level messages
- `combined.log`: All messages
- Console: All messages (with colors)

Configure log level in your .env:
```
LOG_LEVEL=info  # debug, info, warn, error
```