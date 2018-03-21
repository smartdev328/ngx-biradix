import * as nodemailer from "nodemailer";
import * as sgTransport from "nodemailer-sendgrid-transport";
import { IEmail} from "../contracts/IEmail";
import { SENDGRID_PASSWORD, SENDGRID_USERNAME } from "./Settings";

const options = {
    auth: {
        api_key: SENDGRID_PASSWORD,
        api_user: SENDGRID_USERNAME,
    },
};

const client = nodemailer.createTransport(sgTransport(options));

export class EmailService {
    public static send(email: IEmail): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            client.sendMail(email, (emailError, status) => {
                if (emailError) {
                    return reject(emailError);
                }

                return resolve(status);
            });
        });
    }
}
