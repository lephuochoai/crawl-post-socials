import { Post } from '@/databases/entities';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueueService } from '../queue/queue.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class DownloadSchedulerService {
  private readonly logger = new Logger(DownloadSchedulerService.name);
  private readonly BATCH_SIZE = 30;

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly queueService: QueueService
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async handleCronDownloadVideoPosts() {
    this.logger.log('Starting download video posts dsa');
    try {
      const posts = await this.fetchPosts();
      if (!posts || posts.length === 0) {
        this.logger.warn('No posts to download');
        return;
      }

      await this.processPosts(posts);
    } catch (error) {
      this.logger.error('Failed to handle cron download video posts', error);
    }
  }

  private async processPosts(posts: Post[]) {
    try {
      this.logger.log(`Processing download video posts for ${posts.length} posts`);
      const batchSize = this.BATCH_SIZE;
      const totalBatches = Math.ceil(posts.length / batchSize);

      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min((batchIndex + 1) * batchSize, posts.length);
        const batch = posts.slice(start, end);

        this.logger.log(`Processing batch ${batchIndex + 1}/${totalBatches}: ${batch.length} posts`);
        await this.queueService.addBulkDownloadVideoPostsJob(batch);

        await this.postRepository.update(
          batch.map((p) => p.id),
          { isQueued: true }
        );

        if (batchIndex < totalBatches - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process download video posts for ${posts.length} posts`, error);
    }
  }

  private async fetchPosts() {
    const baseQuery = this.postRepository
      .createQueryBuilder('post')
      .where('post.isDownloaded = false')
      .andWhere('post.isQueued = false')
      .getMany();
    return baseQuery;
  }
}
