import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsUrl } from 'class-validator';

export class DownloadMediaDto {
  @ApiProperty({
    example: 123,
    description: 'The ID of the media to download',
  })
  @IsNumber()
  mediaId: number;

  @ApiProperty({
    example: 'https://example.com/video.mp4',
    description: 'The URL of the media',
  })
  @IsString()
  @IsUrl()
  url: string;
}
