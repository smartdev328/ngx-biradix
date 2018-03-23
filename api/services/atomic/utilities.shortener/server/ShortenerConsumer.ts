import {RedisClient} from "redis";
import {IRPCMessage} from "../../../library/sharedContracts/IMessage";
import {HEALTH_FUNCTION, QUEUE_NAME, RETRIEVE_FUNCTION, SHORTEN_FUNCTION} from "../contracts/Settings";
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

            const queue = this.createQueue();

            queue.on("consuming", () => {
                console.log(`${QUEUE_NAME} consuming`);
                resolve("Success");
            });
        });
    }

    private createQueue(): any {
        const exchange = this.rabbit.default();
        const queue = exchange.queue({ name: QUEUE_NAME, durable: true, prefetch: 1 });
        queue.consume(this.consumer);

        return queue;
    }

    private consumer(message: IRPCMessage, reply: any) {
        switch (message.functionName) {
            case SHORTEN_FUNCTION:
                shortenerService.shorten(message.payload.body, message.payload.expiresInMinutes)
                    .then((key: string) => {
                        reply({error: null, key});
                    })
                    .catch((error: any) => {
                        reply({error, key: null});
                    });
                break;
            case RETRIEVE_FUNCTION:
                shortenerService.retrieve(message.payload)
                    .then((body: string) => {
                        reply({error: null, body});
                    })
                    .catch((error: any) => {
                        reply({error, body: null});
                    });
                break;
            case HEALTH_FUNCTION:
                reply({error: null});
                break;
            default:
                throw new Error(message.functionName + " not implemented");
        }
    }
}
