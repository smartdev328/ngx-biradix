import {IRPCMessage} from "../../../library/sharedContracts/IMessage";
import {QUEUE_NAME,RABBIT_FUNCTION} from "../contracts/Settings";

export class LatencyConsumer {
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
            case RABBIT_FUNCTION:
                reply({error: null, success: true});
                break;
            default:
                console.error(message.functionName + " not implemented");
                reply({error: message.functionName + " not implemented", status: null});

        }
    }
}
