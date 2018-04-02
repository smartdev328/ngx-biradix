import {GraphQLError, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import * as ServiceRegistry from "../ServiceRegistry";

export const StringRetrieve = {
    args: {
        key: {type: new GraphQLNonNull(GraphQLString)},
    },
    description: "Retrieve your long string back with a key.",
    type: GraphQLString,
    resolve(_, {key}, request) {
        if (!request.user) {
            throw new GraphQLError("You are not authorized to access function");
        }
        return ServiceRegistry.getShortenerService().retrieve(key);
    },
};
