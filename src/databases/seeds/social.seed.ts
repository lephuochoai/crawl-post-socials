import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Social } from '@/databases/entities';
import { SocialPlatform } from '@/shared/enums';

export const seedSocials = async (dataSource: DataSource, logger: Logger) => {
  const socialRepo = dataSource.getRepository(Social);
  const platforms = Object.values(SocialPlatform);

  for (const platform of platforms) {
    const social = new Social();
    social.platform = platform;
    await socialRepo.save(social);
    logger.log(`✅ Created Social: ${platform}`);
  }
};
