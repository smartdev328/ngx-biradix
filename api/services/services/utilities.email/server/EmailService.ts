import * as sgMail from "@sendgrid/mail";
import { IEmail} from "../contracts/IEmail";
import { SENDGRID_API_KEY } from "./Settings";

sgMail.setApiKey(SENDGRID_API_KEY);

export class EmailService {
    public static send(email: IEmail): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            sgMail.send(email as any).then((success) => {
                return resolve({message: "success"});
            }).catch((error) => {
                return reject(error);
            });
        });
    }
}
