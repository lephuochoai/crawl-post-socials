import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CrawlPostDto {
  @ApiProperty({
    description: 'The username of the Twitter account to crawl',
    example: 'taylorswift13',
  })
  @IsString()
  @IsNotEmpty()
  username: string;
}
