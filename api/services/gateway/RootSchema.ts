import {GraphQLSchema } from "graphql";
import {RootMutationType} from "./RootMutationType";
import {RootQueryType} from "./RootQueryType";

export const RootSchema = new GraphQLSchema({
    mutation: RootMutationType,
    query: RootQueryType,

});
