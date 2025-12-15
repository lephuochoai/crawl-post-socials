import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';

@ApiTags('health')
@Controller('')
export class AppController {
  constructor(
    private readonly health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private configService: ConfigService
  ) {}

  @Get('health')
  @HealthCheck()
  @ApiOkResponse({
    description: '200 when healthy',
  })
  @ApiOperation({
    summary: 'Check server health.',
    description: 'Checks are all of the components healthy and returns 200 if yes.',
  })
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }
}
