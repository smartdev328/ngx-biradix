import * as jackrabbit from "jackrabbit";
import {IEmail} from "../contracts/IEmail";
import {TOPIC} from "../contracts/Settings";
import {EmailService} from "./EmailService";

export class EmailConsumer {
    private rabbit;

    public init(RABBIT_URL: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.rabbit = jackrabbit(RABBIT_URL);
            this.rabbit.on("connected", () => {
                console.log(`${TOPIC} Server connected`);

                const queue = this.createQueue();

                queue.on("consuming", () => {
                    console.log(`${TOPIC} Server consuming`);
                    resolve("Success");
                });
            });
        });
    }

    private createQueue(): any {
        const exchange = this.rabbit.default();
        const queue = exchange.queue({ name: TOPIC, durable: true, prefetch: 1 });
        queue.consume(this.consumer);

        return queue;
    }

    private consumer(data: IEmail, reply: any) {
        EmailService.send(data)
            .then((status: any) => {
                reply({error: null, status});
            })
            .catch((error: any) => {
                reply({error, status: null});
            });
    }
}
