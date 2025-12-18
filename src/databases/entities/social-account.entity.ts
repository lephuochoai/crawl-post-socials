import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base/base.entity';
import { Influencer, Social, Post } from '.';

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
  platformUserId: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'bigint', nullable: true })
  followingCount: number;

  @Column({ type: 'bigint', nullable: true })
  followersCount: number;

  @Column({ type: 'timestamp', nullable: true })
  joinDate: Date;

  @Column({ type: 'text', nullable: true })
  avatar: string;

  @OneToMany(
    () => Post,
    (post) => post.socialAccount
  )
  posts: Post[];

  @ManyToOne(
    () => Influencer,
    (influencer) => influencer.accounts
  )
  influencer: Influencer;

  @ManyToOne(() => Social)
  social: Social;
}
