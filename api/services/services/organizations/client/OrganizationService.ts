import {IRPCMessage} from "../../../library/sharedContracts/IMessage";
import {IOrganizationService} from "../contracts/IOrganizationService";
import {OrganizationSearchRequest} from "../contracts/OrganizationSearchRequest";
import {OrganizationSearchResponse} from "../contracts/OrganizationSearchResponse";
import {HEALTH_FUNCTION, QUEUE_NAME, READ_FUNCTION} from "../contracts/Settings";

export class OrganizationService implements IOrganizationService {
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

    public health(): Promise<string> {
        return new Promise<any>((resolve, reject) => {
            const message: IRPCMessage = {functionName: HEALTH_FUNCTION, payload: {}};
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

    public read(searchRequest: OrganizationSearchRequest): Promise<OrganizationSearchResponse> {
        return new Promise<OrganizationSearchResponse>((resolve, reject) => {
            const message: IRPCMessage = {functionName: READ_FUNCTION, payload: searchRequest};
            this.exchange.publish(message, {
                key: QUEUE_NAME,
                reply(data: any) {
                    if (data.error) {
                        return reject(data.error);
                    }

                    return resolve(data.searchResponse);
                },
            });
        });
    }

    private getExchange() {
        return this.rabbit.default();
    }
}
