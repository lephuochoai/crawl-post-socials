import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from '@/databases/entities/media.entity';
import { FileService } from './file.service';

import { FileController } from './file.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Media])],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
