import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Influencer, SocialAccount } from '@/databases/entities';
import { InfluencerController } from './influencer.controller';
import { InfluencerService } from './influencer.service';

@Module({
  imports: [TypeOrmModule.forFeature([Influencer, SocialAccount])],
  controllers: [InfluencerController],
  providers: [InfluencerService],
})
export class InfluencerModule {}
