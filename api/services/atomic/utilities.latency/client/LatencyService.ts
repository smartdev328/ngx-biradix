import {IRPCMessage} from "../../../library/sharedContracts/IMessage";
import {ILatencyService} from "../contracts/ILatencyService";
import {QUEUE_NAME, RABBIT_FUNCTION} from "../contracts/Settings";

export class LatencyService implements ILatencyService {
    private rabbit;
    private exchange;

    public init(rabbit: any): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            console.log(`${QUEUE_NAME} ready to publish`);
            this.rabbit = rabbit;
            this.exchange = this.getExchange();
            resolve("Success");
        });
    }

    public latency(): Promise<number> {
        return new Promise<any>((resolve, reject) => {
            const message: IRPCMessage = {functionName: RABBIT_FUNCTION, payload: {}};
            const time = new Date().getTime();
            this.exchange.publish(message, {
                key: QUEUE_NAME,
                reply(data: any) {
                    if (data.error) {
                        return reject(data.error);
                    }

                    return resolve(new Date().getTime() - time);
                },
            });
        });
    }
    private getExchange() {
        return this.rabbit.default();
    }
}
