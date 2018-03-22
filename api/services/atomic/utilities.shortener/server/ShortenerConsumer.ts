import {RedisClient} from "redis";
import {RETRIEVE_KEY, SHORTEN_KEY, TOPIC} from "../contracts/Settings";
import {ShortenerService} from "./ShortenerService";

let shortenerService: ShortenerService;

export class ShortenerConsumer {
    private rabbit;
    private redisClient: RedisClient;

    public init(rabbit: any, redisClient: RedisClient): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.rabbit = rabbit;
            this.redisClient = redisClient;

            shortenerService = new ShortenerService(redisClient);

            const queue = this.createShortenQueue();

            let count = 0;
            queue.on("consuming", () => {
                console.log(`${TOPIC}.${SHORTEN_KEY} consuming`);
                count++;

                if (count === 2) {
                    resolve("Success");
                }
            });

            const queue2 = this.createRetrieveQueue();

            queue2.on("consuming", () => {
                count++;
                console.log(`${TOPIC}.${RETRIEVE_KEY} consuming`);

                if (count === 2) {
                    resolve("Success");
                }
            });
        });
    }

    private createShortenQueue(): any {
        const exchange = this.rabbit.default();
        const queue = exchange.queue({ name: TOPIC + "." + SHORTEN_KEY, durable: true, prefetch: 1 });
        queue.consume(this.shortenConsumer);

        return queue;
    }

    private createRetrieveQueue(): any {
        const exchange = this.rabbit.default();
        const queue = exchange.queue({ name: TOPIC + "." + RETRIEVE_KEY, durable: true, prefetch: 1 });
        queue.consume(this.retrieveConsumer);

        return queue;
    }

    private shortenConsumer(data: any, reply: any) {
        shortenerService.shorten(data.body, data.expiresInMinutes)
            .then((key: string) => {
                reply({error: null, key});
            })
            .catch((error: any) => {
                reply({error, key: null});
            });
    }

    private retrieveConsumer(data: any, reply: any) {
        shortenerService.retrieve(data.key)
            .then((body: string) => {
                reply({error: null, body});
            })
            .catch((error: any) => {
                reply({error, body: null});
            });
    }
}
