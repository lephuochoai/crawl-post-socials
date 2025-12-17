import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CrawlPostDto {
  @ApiProperty({
    description: 'The username of the Twitter account to crawl',
    example: 'taylorswift13',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'The maximum number of tweets to collect',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  maxCollectCount?: number;
}
