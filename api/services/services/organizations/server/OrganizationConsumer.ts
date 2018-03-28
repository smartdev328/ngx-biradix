import * as mongoose from "mongoose";
import {IRPCMessage} from "../../../library/sharedContracts/IMessage";
import {OrganizationSearchResponse} from "../contracts/OrganizationSearchResponse";
import {HEALTH_FUNCTION, QUEUE_NAME, READ_FUNCTION} from "../contracts/Settings";
import {OrganizationReadService} from "./OrganizationReadService";
import {Repository} from "./OrganizationRepository";
let organizationReadService: OrganizationReadService;

export class OrganizationConsumer {
    private rabbit;

    public init(rabbit: any, mongooseCoonection: mongoose.Connection): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.rabbit = rabbit;

            const queue = this.createQueue();
            const repository = new Repository(mongooseCoonection);

            organizationReadService = new OrganizationReadService(repository);

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
            case READ_FUNCTION:
                organizationReadService.read(message.payload)
                    .then((searchResponse: OrganizationSearchResponse) => {
                        reply({error: null, searchResponse});
                    })
                    .catch((error: any) => {
                        console.error(error);
                        reply({error: error.toString(), searchResponse: null});
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
