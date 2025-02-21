#!/usr/bin/env node

// examples/cli.ts
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { publisher, scheduler } from '../index';

export const cli = yargs(hideBin(process.argv))
    .command('publish <file>', 'Publish a markdown file', (yargs) => {
        return yargs.positional('file', {
            describe: 'Path to markdown file',
            type: 'string'
        });
    }, async (argv) => {
        try {
            const post = await publisher.parseMarkdownFile(argv.file as string);
            await publisher.publishPost(post);
            console.log('Post published successfully!');
        } catch (error) {
            console.error('Failed to publish post:', error);
            process.exit(1);
        }
    })
    .command('schedule <file> <time>', 'Schedule a markdown file', (yargs) => {
        return yargs
            .positional('file', {
                describe: 'Path to markdown file',
                type: 'string'
            })
            .positional('time', {
                describe: 'Scheduled time (ISO string)',
                type: 'string'
            });
    }, async (argv) => {
        try {
            const post = await publisher.parseMarkdownFile(argv.file as string);
            await publisher.schedulePost(post, new Date(argv.time as string));
            console.log('Post scheduled successfully!');
        } catch (error) {
            console.error('Failed to schedule post:', error);
            process.exit(1);
        }
    })
    .command('start-scheduler', 'Start the post scheduler', () => {}, () => {
        scheduler.start();
        console.log('Scheduler started');
    })
    .command('stop-scheduler', 'Stop the post scheduler', () => {}, () => {
        scheduler.stop();
        console.log('Scheduler stopped');
    })
    .help()
    .argv;