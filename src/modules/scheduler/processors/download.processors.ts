import { Post } from '@/databases/entities';
import { FileService } from '@/modules/file/file.service';
import { QUEUE_NAMES } from '@/shared/constants';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';

@Processor(QUEUE_NAMES.DOWNLOAD, { concurrency: 30 })
export class DownloadProcessor extends WorkerHost {
  private readonly logger = new Logger(DownloadProcessor.name);

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly fileService: FileService
  ) {
    super();
  }

  async process(job: Job) {
    const { name } = job;

    try {
      switch (name) {
        case 'download-video-post':
          return await this.handleDownloadVideoPost(job);
        default:
          throw new Error(`Unknown job type: ${name}`);
      }
    } catch (error) {
      this.logger.error(`Error processing job ${name}: ${error.message}`);
      throw error;
    }
  }

  private async handleDownloadVideoPost(job: Job) {
    const { tweetId, url } = job.data;
    try {
      this.logger.log(`Downloading video post ${tweetId} from ${url}`);
      const filePath = await this.fileService.downloadMedia(url);
      if (!filePath) {
        return;
      }
      await this.postRepository.update({ tweetId }, { filePath, isDownloaded: true });
    } catch (error) {
      this.logger.error(`Failed to download video post ${tweetId} from ${url}: ${error.message}`);
    }
  }
}
