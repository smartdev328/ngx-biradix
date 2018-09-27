import {GraphQLObjectType, GraphQLSchema} from "graphql";
import {StringShorten} from "./mutations/StringShorten";
import {Organizations} from "./queries/Organizations";
import {StringRetrieve} from "./queries/StringRetrieve";
import {GQLApprovedListCreateMutation, GQLApprovedListQuery} from "../../approvedlists/graphql/GQLApprovedListItem";
import {GQLUnApprovedListQuery} from "../../properties/graphql/GQLUnapprovedItems";

export const RootSchema = new GraphQLSchema({
    mutation: new GraphQLObjectType({
        fields: {
            StringShorten,
            ApprovedListItemCreate: GQLApprovedListCreateMutation,
        },
        name: "RootMutationType",
    }),
    query: new GraphQLObjectType({
        fields: {
            Organizations,
            StringRetrieve,
            ApprovedList: GQLApprovedListQuery,
            UnapprovedList: GQLUnApprovedListQuery,
        },
        name: "RootQueryType",
    }),
});
