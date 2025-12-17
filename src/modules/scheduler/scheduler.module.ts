import { Module } from '@nestjs/common';
import { QueueModule } from '../queue/queue.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from '@/databases/entities';
import { FileModule } from '../file/file.module';
import { DownloadSchedulerService } from './download-scheduler.service';
import { DownloadProcessor } from './processors/download.processors';

@Module({
  imports: [QueueModule, FileModule, TypeOrmModule.forFeature([Post])],
  providers: [DownloadSchedulerService, DownloadProcessor],
  exports: [DownloadSchedulerService, DownloadProcessor],
})
export class SchedulerModule {}
