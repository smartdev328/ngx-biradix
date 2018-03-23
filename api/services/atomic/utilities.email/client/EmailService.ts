import {IRPCMessage} from "../../../library/sharedContracts/IMessage";
import {IEmail} from "../contracts/IEmail";
import {IEmailService} from "../contracts/IEmailService";
import {HEARTBEAT_FUNCTION, QUEUE_NAME, SEND_FUNCTION} from "../contracts/Settings";

export class EmailService implements IEmailService {
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

    public heartbeat(): Promise<string> {
        return new Promise<any>((resolve, reject) => {
            const message: IRPCMessage = {functionName: HEARTBEAT_FUNCTION, payload: {}};
            this.exchange.publish(message, {
                key: QUEUE_NAME,
                reply(data: any) {
                    if (data.error) {
                        return reject(data.error);
                    }

                    return resolve("OK");
                },
            });
        });
    }

    public send(email: IEmail): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const message: IRPCMessage = {functionName: SEND_FUNCTION, payload: email};
            this.exchange.publish(message, {
                key: QUEUE_NAME,
                reply(data: any) {
                    if (data.error) {
                        return reject(data.error);
                    }

                    return resolve(data.status);
                },
            });
        });
    }

    private getExchange() {
        return this.rabbit.default();
    }
}
