import * as jwt from "jsonwebtoken";
import {ExecutePermission} from "../../auth.permissions/contracts/ExecutePermission";
import {IUserLoggedIn} from "../../users/contracts/IUser";
import {OrganizationSearchRequest} from "../contracts/OrganizationSearchRequest";
import {OrganizationSearchResponse} from "../contracts/OrganizationSearchResponse";
import * as Converter from "./OrganizationConverters";
import {Repository} from "./OrganizationRepository";
import {SECRET} from "./Settings";

export class OrganizationReadService {
    private repository: Repository;

    constructor(repository: Repository) {
        this.repository = repository;
    }

    public read(searchRequest: OrganizationSearchRequest): Promise<OrganizationSearchResponse> {
        const This = this;

        return new Promise<OrganizationSearchResponse>((resolve, reject) => {
            const loggedInUser: IUserLoggedIn = this.getLoggedInUser(searchRequest.userJwt);

            if (!loggedInUser || loggedInUser.permissions.indexOf[ExecutePermission.ADMIN] > -1) {
                return reject("Acces Denied");
            }

            const query = This.repository.model.find();

            if (searchRequest.criteria._id) {
                query.where("_id").equals(searchRequest.criteria._id);
            }

            if (searchRequest.criteria.isDefault) {
                query.where("isDefault").equals(true);
            }

            if (searchRequest.criteria.subdomain) {
                query.where("subdomain").equals(searchRequest.criteria.subdomain);
            }

            query.exec().then((orgs) => {
                const response: OrganizationSearchResponse = new OrganizationSearchResponse();

                response.data = Converter.DBtoObjectArray(orgs);

                return resolve(response);
            }).catch((error) => {
                return reject(error);
            });
        });
    }

    private getLoggedInUser(token: string): IUserLoggedIn {
        if (!jwt) {
            return null;
        }

        try {
            const decoded = jwt.verify(token, SECRET);
            return decoded.data;
        } catch (err) {
            return null;
        }
    }
}
