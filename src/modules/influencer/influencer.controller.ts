import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InfluencerService } from './influencer.service';
import { GetInfluencersDto } from './dto/get-influencers.dto';

@ApiTags('Influencers')
@Controller('influencers')
export class InfluencerController {
  constructor(private readonly influencerService: InfluencerService) {}

  @Get()
  @ApiOperation({ summary: 'Get all influencers with pagination and search' })
  @ApiResponse({ status: 200, description: 'Return list of influencers.' })
  getAll(@Query() dto: GetInfluencersDto) {
    return this.influencerService.getAll(dto);
  }
}
