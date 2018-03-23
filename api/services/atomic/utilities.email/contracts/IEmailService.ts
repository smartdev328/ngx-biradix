import {IEmail} from "./IEmail";

export interface IEmailService {
    init(rabbit: any): Promise<string>;
    heartbeat(): Promise<string>;
    send(email: IEmail): Promise<any>;
}
