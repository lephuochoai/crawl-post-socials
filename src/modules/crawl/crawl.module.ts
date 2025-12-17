import { Module } from '@nestjs/common';
import { CrawlController } from './crawl.controller';
import { CrawlService } from './crawl.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post, SocialAccount, Influencer, Social } from '@/databases/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Post, SocialAccount, Influencer, Social])],
  controllers: [CrawlController],
  providers: [CrawlService],
})
export class CrawlModule {}
