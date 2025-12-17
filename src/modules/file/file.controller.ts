import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
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
  async download(@Body() body: DownloadMediaDto, @Req() req: Request) {
    const { mediaId, url } = body;
    const filePath = await this.fileService.downloadMedia(mediaId, url);
    const fullUrl = `${req.protocol}://${req.get('host')}/${filePath.replace(/\\/g, '/')}`;

    return {
      message: 'Download successful',
      path: filePath,
      url: fullUrl,
    };
  }
}
