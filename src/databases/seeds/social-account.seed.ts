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
    bio: 'Welcome to the official account of Cristiano Ronaldo.',
    followingCount: 80,
    followersCount: 105100000,
    joinDate: new Date('2010-06-01'),
    avatar: 'https://pbs.twimg.com/profile_images/1940344470290989057/1OUP8RgK_200x200.jpg',
  },
  {
    influencerName: 'Taylor Swift',
    platform: SocialPlatform.TWITTER,
    username: 'taylorswift13',
    platformUserId: '17919972',
    bio: "And, baby, that's show business for you. New album The Life of a Showgirl. Available Now",
    followingCount: 0,
    followersCount: 78700000,
    joinDate: new Date('2008-12-01'),
    avatar: 'https://pbs.twimg.com/profile_images/1973025421542236160/73NCkJyb_200x200.jpg',
  },
  {
    influencerName: 'Neymar Jr',
    platform: SocialPlatform.TWITTER,
    username: 'neymarjr',
    platformUserId: null,
    bio: 'Filho de Deus, Pai, Feliz e Ousado !',
    followingCount: 602,
    followersCount: 58100000,
    joinDate: new Date('2010-06-01'),
    avatar: 'https://pbs.twimg.com/profile_images/1908645510853844992/Kr7fu9HW_200x200.jpg',
  },
  {
    influencerName: 'Donald J. Trump',
    platform: SocialPlatform.TWITTER,
    username: 'realDonaldTrump',
    platformUserId: null,
    bio: '45th & 47th President of the United States of America',
    followingCount: 53,
    followersCount: 108500000,
    joinDate: new Date('2009-03-01'),
    avatar: 'https://pbs.twimg.com/profile_images/874276197357596672/kUuht00m_200x200.jpg',
  },
  {
    influencerName: 'Barack Obama',
    platform: SocialPlatform.TWITTER,
    username: 'BarackObama',
    platformUserId: null,
    bio: 'Dad, husband, President, citizen.',
    followingCount: 507900,
    followersCount: 118700000,
    joinDate: new Date('2007-03-01'),
    avatar: 'https://pbs.twimg.com/profile_images/1329647526807543809/2SGvnHYV_200x200.jpg',
  },
  {
    influencerName: 'Elon Musk',
    platform: SocialPlatform.TWITTER,
    username: 'elonmusk',
    platformUserId: null,
    bio: '',
    followingCount: 1247,
    followersCount: 229900000,
    joinDate: new Date('2009-06-01'),
    avatar: 'https://pbs.twimg.com/profile_images/1995407795835772928/Wp7m4L9h_200x200.jpg',
  },
  {
    influencerName: 'Justin Bieber',
    platform: SocialPlatform.TWITTER,
    username: 'justinbieber',
    platformUserId: null,
    bio: '@skylrk',
    followingCount: 5,
    followersCount: 89800000,
    joinDate: new Date('2009-03-01'),
    avatar: 'https://pbs.twimg.com/profile_images/1982551918128893952/qoHpdULH_200x200.jpg',
  },
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
      account.bio = data.bio;
      account.followingCount = data.followingCount;
      account.followersCount = data.followersCount;
      account.joinDate = data.joinDate;
      account.avatar = data.avatar;

      await accountRepo.save(account);
      logger.log(`✅ Created SocialAccount: ${data.influencerName} - ${data.platform}`);
    } else {
      logger.warn(
        `⚠️  Skipped SocialAccount for ${data.influencerName} on ${data.platform} (Influencer or Social not found)`
      );
    }
  }
};
