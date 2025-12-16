import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base/base.entity';
import { Influencer, Social, Media } from '.';

@Entity('social_accounts')
export class SocialAccount extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  influencerId: number;

  @Column({ type: 'bigint' })
  socialId: number;

  @Column({ type: 'varchar', length: 255, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  platformUserId: string;

  @Column({ type: 'timestamp', nullable: true })
  lastCrawlTime: Date;

  @OneToMany(
    () => Media,
    (media) => media.socialAccount
  )
  medias: Media[];

  @ManyToOne(
    () => Influencer,
    (influencer) => influencer.accounts
  )
  influencer: Influencer;

  @ManyToOne(() => Social)
  social: Social;
}
