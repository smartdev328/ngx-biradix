import {GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import * as ServiceRegistry from "../ServiceRegistry";

export const HeartbeatSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
        fields: {
            utilities_email: {
                type: GraphQLString,
                resolve() {
                    return ServiceRegistry.getEmailService().heartbeat();
                },
            },
            utilities_shortener: {
                type: GraphQLString,
                resolve() {
                    return ServiceRegistry.getShortenerService().heartbeat();
                },
            },
        },
        name: "RootQueryType",
    }),
});
