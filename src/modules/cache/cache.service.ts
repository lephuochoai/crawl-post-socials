import { HackathonConfig } from '@/configs';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { Cluster } from 'ioredis';

@Injectable()
export class CacheService {
  private redis: Cluster | Redis;
  private host: string;
  private port: number;
  private password?: string;
  constructor(private readonly configService: ConfigService<HackathonConfig>) {
    this.host = this.configService.get('redis.host', { infer: true });
    this.port = this.configService.get('redis.port', { infer: true });
    this.password = this.configService.get('redis.password', { infer: true });
    const isUseCluster = this.configService.get('redis.cluster', { infer: true });

    this.redis = isUseCluster
      ? new Redis.Cluster([{ host: this.host, port: this.port }], {
          dnsLookup: (address, callback) => callback(null, address),
          redisOptions: {
            tls: {},
            password: this.password,
            lazyConnect: true,
            keepAlive: 1000,
          },
        })
      : new Redis({
          host: this.host,
          port: this.port,
          password: this.password,
          lazyConnect: true,
          keepAlive: 1000,
        });

    this.health();
  }

  getClient(): Cluster | Redis {
    return this.redis;
  }

  /**
   * Checks the health of the Redis connection by sending a ping command.
   *
   * @returns A promise that resolves with the response from the Redis server,
   *          typically "PONG" if the connection is healthy.
   */
  health() {
    return this.redis.ping();
  }

  /**
   * This method retrieves data from Redis.
   * @param key - The key of the data to retrieve.
   * @returns The data associated with the key, or null if the key does not exist.
   */
  async get(key: string) {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * This method stores data in Redis.
   * @param key - The key under which to store the data.
   * @param value - The data to store.
   * @param ttl - The time-to-live (in seconds) after which the data should be deleted.
   * @returns A promise that resolves when the data has been stored.
   */
  async set(key: string, value: any, ttl: number) {
    return await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  /**
   * This method deletes data from Redis.
   * @param key - The key of the data to delete.
   * @returns A promise that resolves when the data has been deleted.
   */
  async del(key: string) {
    return await this.redis.del(key);
  }

  async getTTL(key: string) {
    return await this.redis.ttl(key);
  }
}
