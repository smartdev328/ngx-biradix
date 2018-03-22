import {RedisClient} from "redis";
import {IShortenerService} from "../contracts/IShortenerService";
import {RETRIEVE_KEY, SHORTEN_KEY, TOPIC} from "../contracts/Settings";

export class ShortenerService implements IShortenerService{
    private rabbit;
    private exchange;
    private redisClient: RedisClient;

    public init(rabbit: any, redisClient: RedisClient): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            console.log(`${TOPIC} ready to publish`);
            this.rabbit = rabbit;
            this.exchange = this.getExchange();
            this.redisClient = redisClient;
            resolve("Success");
        });
    }

    public shorten(body: string, expiresInMinutes: number): Promise<string> {
        return new Promise<any>((resolve, reject) => {
            this.exchange.publish({
                body,
                expiresInMinutes,
            }, {
                key: TOPIC + "." + SHORTEN_KEY,
                reply(data: any) {
                    if (data.error) {
                        return reject(data.error);
                    }

                    return resolve(data.key);
                },
            });
        });
    }

    public retrieve(key: string): Promise<string> {
        return new Promise<any>((resolve, reject) => {
            this.exchange.publish({
                key,
            }, {
                key: TOPIC + "." + RETRIEVE_KEY,
                reply(data: any) {
                    if (data.error) {
                        return reject(data.error);
                    }
                    return resolve(data.body);
                },
            });
        });
    }

    private getExchange() {
        return this.rabbit.default();
    }
}
