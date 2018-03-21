import * as jackrabbit from "jackrabbit";
import {IEmail} from "../contracts/IEmail";
import {TOPIC} from "../contracts/Settings";

export class EmailService {
    private rabbit;
    private exchange;

    public init(RABBIT_URL: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this.rabbit = jackrabbit(RABBIT_URL);
            this.rabbit.on("connected", () => {
                console.log(`${TOPIC} Client connected`);
                this.exchange = this.getExchange();
                resolve("Success");
            });
        });
    }

    public send(email: IEmail): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.exchange.publish(email, {
                key: TOPIC,
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
