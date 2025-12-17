import { registerAs } from '@nestjs/config';
import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class MainConfig {
  @IsNotEmpty()
  @IsNumber()
  port: number;

  @IsNotEmpty()
  @IsBoolean()
  isProduction: boolean;

  @IsNotEmpty()
  @IsString()
  apiPrefix: string;

  @IsNotEmpty()
  @IsString()
  twitterGoogleEmail: string;

  @IsNotEmpty()
  @IsString()
  twitterGooglePassword: string;

  constructor() {
    this.port = Number(process.env.PORT);
    this.isProduction = process.env.PRODUCTION === 'true';
    this.apiPrefix = process.env.API_PREFIX || 'api';
    this.twitterGoogleEmail = process.env.TWITTER_GOOGLE_EMAIL;
    this.twitterGooglePassword = process.env.TWITTER_GOOGLE_PASSWORD;
  }
}

export const main = registerAs<MainConfig>('main', () => new MainConfig());
