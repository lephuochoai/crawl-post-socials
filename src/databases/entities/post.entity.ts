import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base/base.entity';
import { SocialAccount } from './social-account.entity';

@Entity('posts')
export class Post extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  tweetId: string;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', array: true, nullable: true })
  hashtags: string[];

  @Column({ type: 'timestamp' })
  postedAt: Date;

  @Column({ type: 'bigint' })
  socialAccountId: number;

  @Column({ type: 'boolean' })
  isDownloaded: boolean;

  @ManyToOne(
    () => SocialAccount,
    (socialAccount) => socialAccount.posts
  )
  socialAccount: SocialAccount;
}
