import {RedisClient} from "redis";
import {IRPCMessage} from "../../../library/sharedContracts/IMessage";
import {IShortenerService} from "../contracts/IShortenerService";
import {QUEUE_NAME, RETRIEVE_FUNCTION, SHORTEN_FUNCTION} from "../contracts/Settings";

export class ShortenerService implements IShortenerService {
    private rabbit;
    private exchange;
    private redisClient: RedisClient;

    public init(rabbit: any, redisClient: RedisClient): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            console.log(`${QUEUE_NAME} ready to publish`);
            this.rabbit = rabbit;
            this.exchange = this.getExchange();
            this.redisClient = redisClient;
            resolve("Success");
        });
    }

    public shorten(body: string, expiresInMinutes: number): Promise<string> {
        return new Promise<any>((resolve, reject) => {
            const message: IRPCMessage = {
                functionName: SHORTEN_FUNCTION,
                payload: {
                    body,
                    expiresInMinutes,
                },
            };
            this.exchange.publish(message, {
                key: QUEUE_NAME,
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
            const message: IRPCMessage = {
                functionName: RETRIEVE_FUNCTION,
                payload: key,
            };

            this.exchange.publish(message, {
                key: QUEUE_NAME,
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
