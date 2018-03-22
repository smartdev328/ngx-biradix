import {IEmail} from "./IEmail";

export interface IEmailService {
    init(rabbit: any): Promise<string>;
    send(email: IEmail): Promise<any>;
}
