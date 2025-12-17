import { Post } from '@/databases/entities';
import { QUEUE_NAMES } from '@/shared/constants';
import { Logger } from '@/shared/logger';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private logger = new Logger(QueueService.name);

  constructor(@InjectQueue(QUEUE_NAMES.DOWNLOAD) private downloadQueue: Queue) {}

  async addBulkDownloadVideoPostsJob(posts: Post[]) {
    try {
      if (!posts || posts.length === 0) {
        return;
      }

      const bulkJobs = posts.map((post) => ({
        name: 'download-video-post',
        data: post,
      }));

      await this.downloadQueue.addBulk(bulkJobs);
    } catch (error) {
      this.logger.error(`Failed to add bulk download video posts job`, error);
      throw error;
    }
  }
}
