import {RedisClient} from "redis";

export interface IShortenerService {
    init(rabbit: any, redisClient: RedisClient): Promise<string>;
    heartbeat(): Promise<string>;
    shorten(body: string, expiresInMinutes: number): Promise<string>;
    retrieve(key: string): Promise<string>;
}
