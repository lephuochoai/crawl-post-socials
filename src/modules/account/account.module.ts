import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialAccount, Post } from '@/databases/entities';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [TypeOrmModule.forFeature([SocialAccount, Post])],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
