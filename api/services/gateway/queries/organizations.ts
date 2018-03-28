import {GraphQLError, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import {OrganizationSearchResponse} from "../../services/organizations/contracts/OrganizationSearchResponse";
import * as ServiceRegistry from "../ServiceRegistry";

export const organizations = {
    args: {

    },
    description: "Retrieve list of client organizations.",
    type: new GraphQLList(GraphQLString),
    resolve(parent, {}, request) {
        return ServiceRegistry.getOrganizationService().read({
            criteria: {},
            userJwt: request.user_jwt,
            webContext: request.context,
        }).then((response: OrganizationSearchResponse) => {
            return response.data.map((x) => {
                return x.name;
            });
        }).catch((error) => {
            throw new GraphQLError(error);
        });
    },
};
