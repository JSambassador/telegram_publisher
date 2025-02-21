"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostScheduler = void 0;
const cron_1 = require("cron");
class PostScheduler {
    constructor(publisher) {
        this.publisher = publisher;
        this.cronJob = new cron_1.CronJob('*/5 * * * *', () => {
            this.publisher.processScheduledPosts();
        });
    }
    start() {
        this.cronJob.start();
    }
    stop() {
        this.cronJob.stop();
    }
}
exports.PostScheduler = PostScheduler;
