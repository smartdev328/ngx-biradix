import {GraphQLError, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import * as ServiceRegistry from "../ServiceRegistry";

export const StringShorten = {
        args: {
            body: {type: new GraphQLNonNull(GraphQLString)},
            expiresInMinutes: {type: new GraphQLNonNull(GraphQLInt)},
        },
        description: "Shorten a large text string or stringified JSON object into a key. This is used to pass large settings objects to certain reports.",
        type: GraphQLString,
        resolve(_, {body, expiresInMinutes}, request) {
            if (!request.user) {
                throw new GraphQLError("You are not authorized to access function");
            }
            return ServiceRegistry.getShortenerService().shorten(body, expiresInMinutes);
        },
    };
