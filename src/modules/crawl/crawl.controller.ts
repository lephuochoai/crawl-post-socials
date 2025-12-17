import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CrawlService } from './crawl.service';
import { CrawlPostDto } from './dto/crawl-post.dto';

@ApiTags('Crawl')
@Controller('crawl')
export class CrawlController {
  constructor(private readonly crawlService: CrawlService) {}

  @Post()
  @ApiOperation({ summary: 'Crawl video posts for a specific Twitter user' })
  @ApiResponse({ status: 201, description: 'The crawl process has been triggered successfully.' })
  async crawl(@Body() dto: CrawlPostDto) {
    return this.crawlService.crawlVideoPosts(dto);
  }
}
