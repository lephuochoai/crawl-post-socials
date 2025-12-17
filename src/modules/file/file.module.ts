import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileService } from './file.service';

import { FileController } from './file.controller';
import { Post } from '@/databases/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Post])],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
