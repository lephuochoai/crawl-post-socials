import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { OrmModule } from './orm.module';

import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ExceptionFilter } from './common/exceptions/exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { load } from './configs';
import { HttpModule } from '@nestjs/axios';

import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { CrawlModule } from './modules/crawl/crawl.module';
import { InfluencerModule } from './modules/influencer/influencer.module';
import { AccountModule } from './modules/account/account.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      load,
    }),
    SentryModule.forRoot(),
    OrmModule,
    TerminusModule,
    HttpModule,
    CrawlModule,
    InfluencerModule,
    AccountModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
