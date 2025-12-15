import type { ConfigFactory } from '@nestjs/config';
import type { ClassConstructor } from 'class-transformer';
import { plainToClass } from 'class-transformer';
import { validateOrReject } from 'class-validator';

import { database, DatabaseConfig } from './database.config';
import { main, MainConfig } from './main.config';
import { redis, RedisConfig } from './redis.config';

async function validateConfig<T extends object>(configClass: ClassConstructor<T>, config: NodeJS.ProcessEnv) {
  const configInstance = plainToClass(configClass, config);
  try {
    await validateOrReject(configInstance);
  } catch (errors) {
    throw new Error(`${configClass.name} config validation failed!\nSuggestion: ${errors}`);
  }
}

export async function validateAllConfigs() {
  await Promise.all([
    validateConfig(MainConfig, process.env),
    validateConfig(DatabaseConfig, process.env),
    validateConfig(RedisConfig, process.env),
  ]);
}

export const load: ConfigFactory[] = [main, database, redis];

export type HackathonConfig = {
  main: MainConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
};
