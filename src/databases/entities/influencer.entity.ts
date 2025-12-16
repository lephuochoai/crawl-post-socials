import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base/base.entity';
import { SocialAccount } from '.';

@Entity('influencers')
export class Influencer extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @OneToMany(
    () => SocialAccount,
    (account) => account.influencer
  )
  accounts: SocialAccount[];
}
