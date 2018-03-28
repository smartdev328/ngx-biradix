import {GraphQLObjectType, GraphQLSchema} from "graphql";
import {StringShorten} from "./mutations/StringShorten";
import {Organizations} from "./queries/Organizations";
import {StringRetrieve} from "./queries/StringRetrieve";

export const RootSchema = new GraphQLSchema({
    mutation: new GraphQLObjectType({
        fields: {
            StringShorten,
        },
        name: "RootMutationType",
    }),
    query: new GraphQLObjectType({
        fields: {
            Organizations,
            StringRetrieve,
        },
        name: "RootQueryType",
    }),
});
