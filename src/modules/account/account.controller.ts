import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AccountService } from './account.service';
import { QueryPaginationDto } from '@/shared/dto/pagination.query';

@ApiTags('Accounts')
@Controller('accounts')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get(':id/posts')
  @ApiOperation({ summary: 'Get posts for a specific social account' })
  @ApiResponse({ status: 200, description: 'Return list of posts.' })
  getPosts(@Param('id', ParseIntPipe) id: number, @Query() paginationDto: QueryPaginationDto) {
    return this.accountService.getPosts(id, paginationDto);
  }
}
