import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Influencer, Social, SocialAccount } from '@/databases/entities';
import { SocialPlatform } from '@/shared/enums';

const accountsData = [
  {
    influencerName: 'Cristiano Ronaldo',
    platform: SocialPlatform.TWITTER,
    username: 'Cristiano',
    platformUserId: '155659213',
  },
  // Thêm account khác vào đây
];

export const seedSocialAccounts = async (dataSource: DataSource, logger: Logger) => {
  const accountRepo = dataSource.getRepository(SocialAccount);
  const influencerRepo = dataSource.getRepository(Influencer);
  const socialRepo = dataSource.getRepository(Social);

  for (const data of accountsData) {
    const influencer = await influencerRepo.findOne({ where: { name: data.influencerName } });
    const social = await socialRepo.findOne({ where: { platform: data.platform } });

    if (influencer && social) {
      const account = new SocialAccount();
      account.influencer = influencer;
      account.social = social;
      account.username = data.username;
      account.platformUserId = data.platformUserId;

      await accountRepo.save(account);
      logger.log(`✅ Created SocialAccount: ${data.influencerName} - ${data.platform}`);
    } else {
      logger.warn(
        `⚠️  Skipped SocialAccount for ${data.influencerName} on ${data.platform} (Influencer or Social not found)`
      );
    }
  }
};
