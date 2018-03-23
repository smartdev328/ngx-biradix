import {IEmail} from "./IEmail";

export interface IEmailService {
    init(rabbit: any): Promise<string>;
    health(): Promise<string>;
    send(email: IEmail): Promise<any>;
}
