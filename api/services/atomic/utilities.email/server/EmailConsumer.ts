import {IRPCMessage} from "../../../library/sharedContracts/IMessage";
import {HEALTH_FUNCTION, QUEUE_NAME, SEND_FUNCTION} from "../contracts/Settings";
import {EmailService} from "./EmailService";

export class EmailConsumer {
    private rabbit;

    public init(rabbit: any): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.rabbit = rabbit;

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
            case SEND_FUNCTION:
                EmailService.send(message.payload)
                    .then((status: any) => {
                        reply({error: null, status});
                    })
                    .catch((error: any) => {
                        console.error(error);
                        reply({error: error.toString(), status: null});
                    });
                break;
            case HEALTH_FUNCTION:
                reply({error: null});
                break;
            default:
                console.error(message.functionName + " not implemented");
                reply({error: message.functionName + " not implemented", status: null});
        }
    }
}
