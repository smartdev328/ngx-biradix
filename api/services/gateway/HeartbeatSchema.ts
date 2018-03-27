import {GraphQLInt, GraphQLObjectType, GraphQLSchema, GraphQLString} from "graphql";
import * as ServiceRegistry from "./ServiceRegistry";

export const HeartbeatSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
        fields: {
            utilities_email: {
                description: "Returns the health status of the utilties.email service. 'OK' means healthy. ",
                type: GraphQLString,
                resolve() {
                    return ServiceRegistry.getEmailService().health();
                },
            },
            utilities_latency_rabbit: {
                description: "Returns the RTT for sending a blank RPC message through RabbitMQ. ",
                type: GraphQLInt,
                resolve() {
                    return ServiceRegistry.getLatencyService().latency();
                },
            },
            utilities_shortener: {
                description: "Returns the health status of the utilties.shortener service. 'OK' means healthy. ",
                type: GraphQLString,
                resolve() {
                    return ServiceRegistry.getShortenerService().health();
                },
            },
        },
        name: "HealthQueries",
    }),
});
