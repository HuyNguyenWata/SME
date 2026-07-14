import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redisClient: Redis) {}

  /**
   * Get the underlying ioredis client instance.
   */
  getClient(): Redis {
    return this.redisClient;
  }

  /**
   * Close the Redis connection gracefully on module destroy.
   */
  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  /**
   * Utility to track usage/quota with an expiration time.
   */
  async incrementWithExpire(
    key: string,
    expireSeconds: number,
  ): Promise<number> {
    const newValue = await this.redisClient.incr(key);

    if (newValue === 1) {
      // First time the key is incremented, set its expiration
      await this.redisClient.expire(key, expireSeconds);
    }

    return newValue;
  }
}
