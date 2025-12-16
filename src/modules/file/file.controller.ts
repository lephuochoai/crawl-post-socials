import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DownloadMediaDto } from './dto/download-media.dto';
import { FileService } from './file.service';

@ApiTags('Files')
@Controller('files')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('download')
  @ApiOperation({ summary: 'Download media from URL' })
  @ApiResponse({ status: 201, description: 'Media downloaded successfully.' })
  async download(@Body() body: DownloadMediaDto) {
    const { mediaId, url } = body;
    const path = await this.fileService.downloadMedia(mediaId, url);
    return {
      message: 'Download successful',
      path,
    };
  }
}
