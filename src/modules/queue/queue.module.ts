import { QUEUE_NAMES } from '@/shared/constants';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          connection: {
            host: configService.get<string>('redis.host', { infer: true }),
            port: configService.get<number>('redis.port', { infer: true }),
            username: configService.get<string>('redis.username', { infer: true }),
            password: configService.get<string>('redis.password', { infer: true }),
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.DOWNLOAD,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          age: 10,
        },
        removeOnFail: 100,
        priority: 0,
      },
    }),
  ],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
