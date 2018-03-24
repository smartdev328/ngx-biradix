import {GraphQLObjectType, GraphQLSchema} from "graphql";
import {stringShorten} from "./mutations/stringShorten";
import {stringRetrieve} from "./queries/stringRetrieve";

export const RootSchema = new GraphQLSchema({
    mutation: new GraphQLObjectType({
        fields: {
            stringShorten,
        },
        name: "RootMutationType",
    }),
    query: new GraphQLObjectType({
        fields: {
            stringRetrieve,
        },
        name: "RootQueryType",
    }),
});
