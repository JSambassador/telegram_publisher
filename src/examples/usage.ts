import { publisher, scheduler } from '../index';
import path from 'path';

// Example 1: Simple post
async function publishSimplePost() {
    const post = await publisher.parseMarkdownFile(
        path.join(__dirname, 'posts/simple.md')
    );
    await publisher.publishPost(post);
}

// Example 2: Post with media
async function publishPostWithMedia() {
    const post = await publisher.parseMarkdownFile(
        path.join(__dirname, 'posts/with-media.md')
    );
    await publisher.publishPost(post);
}

// Example 3: Scheduled post
async function schedulePost() {
    const post = await publisher.parseMarkdownFile(
        path.join(__dirname, 'posts/scheduled.md')
    );
    const scheduledTime = new Date();
    scheduledTime.setHours(scheduledTime.getHours() + 24);
    await publisher.schedulePost(post, scheduledTime);
}