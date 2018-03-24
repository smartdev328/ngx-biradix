import * as md5 from "md5";
import {RedisClient} from "redis";

export class ShortenerService {
    private redisClient: RedisClient;
    constructor(redisClient: RedisClient) {
        this.redisClient = redisClient;
    }

    public shorten(body: string, expiresInMinutes: number): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let key: string;
            key = md5(body);
            this.redisClient.set(key, body);
            this.redisClient.expire(key, expiresInMinutes * 60);
            resolve(key);
        });
    }

    public retrieve(key: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.redisClient.get(key, (error, result) => {
                if (error) {
                    return reject(error);
                }

                return resolve((result || "").toString());
            });
        });
    }
}
