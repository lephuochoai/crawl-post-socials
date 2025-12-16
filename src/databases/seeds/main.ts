import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { DataSource } from 'typeorm';
import { SocialAccount, Influencer, Social } from '@/databases/entities';
import { seedSocials } from './social.seed';
import { seedInfluencers } from './influencer.seed';
import { seedSocialAccounts } from './social-account.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const logger = new Logger('Seed');

  logger.log('🌱 Starting seed...');

  logger.log('🧹 Cleaning up old data...');
  const accountRepo = dataSource.getRepository(SocialAccount);
  const influencerRepo = dataSource.getRepository(Influencer);
  const socialRepo = dataSource.getRepository(Social);

  try {
    // Truncate tables to reset IDs
    await dataSource.query('TRUNCATE TABLE social_accounts RESTART IDENTITY CASCADE');
    await dataSource.query('TRUNCATE TABLE influencers RESTART IDENTITY CASCADE');
    await dataSource.query('TRUNCATE TABLE socials RESTART IDENTITY CASCADE');
    logger.log('✨ Old data cleared and IDs reset');
  } catch (error) {
    logger.warn('⚠️  Could not clear some data (maybe empty or constraint error), continuing...');
    logger.error(error);
  }

  await seedSocials(dataSource, logger);
  await seedInfluencers(dataSource, logger);
  await seedSocialAccounts(dataSource, logger);

  logger.log('🌱 Seed completed!');
  await app.close();
}

bootstrap();
