import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base/base.entity';
import { SocialAccount } from './social-account.entity';

@Entity('medias')
export class Media extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 10 })
  type: 'VIDEO' | 'IMAGE';

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'bigint' })
  socialAccountId: number;

  @Column({ type: 'boolean', default: false })
  isDownloaded: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  filePath: string | null;

  @ManyToOne(
    () => SocialAccount,
    (socialAccount) => socialAccount.medias
  )
  socialAccount: SocialAccount;
}
