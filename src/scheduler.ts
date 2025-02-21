import { CronJob } from 'cron';
import { TelegramPublisher } from './publisher';

export class PostScheduler {
    private publisher: TelegramPublisher;
    private cronJob: CronJob;

    constructor(publisher: TelegramPublisher) {
        this.publisher = publisher;
        this.cronJob = new CronJob('*/5 * * * *', () => {
            this.publisher.processScheduledPosts();
        });
    }

    start(): void {
        this.cronJob.start();
    }

    stop(): void {
        this.cronJob.stop();
    }
}