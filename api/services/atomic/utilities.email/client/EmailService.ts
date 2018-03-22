import {IEmail} from "../contracts/IEmail";
import {IEmailService} from "../contracts/IEmailService";
import {SEND_KEY, TOPIC} from "../contracts/Settings";

export class EmailService implements IEmailService {
    private rabbit;
    private exchange;

    public init(rabbit: any): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            console.log(`${TOPIC} ready to publish`);
            this.rabbit = rabbit;
            this.exchange = this.getExchange();
            resolve("Success");
        });
    }

    public send(email: IEmail): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.exchange.publish(email, {
                key: TOPIC + "." + SEND_KEY,
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
