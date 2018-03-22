import {IEmail} from "../contracts/IEmail";
import {SEND_KEY, TOPIC} from "../contracts/Settings";
import {EmailService} from "./EmailService";

export class EmailConsumer {
    private rabbit;

    public init(rabbit: any): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.rabbit = rabbit;

            const queue = this.createQueue();

            queue.on("consuming", () => {
                console.log(`${TOPIC}.${SEND_KEY} consuming`);
                resolve("Success");
            });
        });
    }

    private createQueue(): any {
        const exchange = this.rabbit.default();
        const queue = exchange.queue({ name: TOPIC + "." + SEND_KEY, durable: true, prefetch: 1 });
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
