import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from './base/base.entity';

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  username: string;
}
