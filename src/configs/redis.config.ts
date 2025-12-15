import { registerAs } from '@nestjs/config';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class RedisConfig {
  @IsNotEmpty()
  @IsString()
  host: string;

  @IsNotEmpty()
  @IsNumber()
  port: number;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsBoolean()
  cluster: boolean;

  constructor() {
    this.host = process.env.REDIS_HOST || 'localhost';
    this.port = Number(process.env.REDIS_PORT) || 6379;
    this.password = process.env.REDIS_PASSWORD || undefined;
    this.name = process.env.REDIS_NAME || undefined;
    this.cluster = process.env.REDIS_CLUSTER === 'true';
  }
}

export const redis = registerAs<RedisConfig>('redis', () => new RedisConfig());
