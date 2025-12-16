import { SocialPlatform } from '@/shared/enums';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base/base.entity';

@Entity('socials')
export class Social extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'enum', enum: SocialPlatform })
  platform: SocialPlatform;
}
