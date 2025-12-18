import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Influencer } from '@/databases/entities';

const influencersData = [
  { name: 'Cristiano Ronaldo' },
  { name: 'Taylor Swift' },
  { name: 'Neymar Jr' },
  { name: 'Barack Obama' },
  { name: 'Donald J. Trump' },
  { name: 'Elon Musk' },
  { name: 'Justin Bieber' },
];

export const seedInfluencers = async (dataSource: DataSource, logger: Logger) => {
  const influencerRepo = dataSource.getRepository(Influencer);

  for (const data of influencersData) {
    const influencer = new Influencer();
    influencer.name = data.name;
    await influencerRepo.save(influencer);
    logger.log(`✅ Created Influencer: ${data.name}`);
  }
};
