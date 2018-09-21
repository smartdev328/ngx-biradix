import {GraphQLBoolean, GraphQLError, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLEnumType, GraphQLInputObjectType } from "graphql";

import * as approvedListService from "../service/ApprovedListsService";
import {IApprovedListItemRead} from "../objects/ApprovedLists";

export const GQLApprovedListType = new GraphQLEnumType({
    name: "ApprovedListType",
    values: {
        MANAGER: {
            value: "Manager",
        },
        OWNER: {
            value: "Owner",
        },
    },
});

export const GQLApprovedListItemRead = new GraphQLObjectType({
    fields: () => ({
        id: { type: new GraphQLNonNull(GraphQLString) },
        active: { type: new GraphQLNonNull(GraphQLBoolean) },
        type: {type: new GraphQLNonNull(GQLApprovedListType) },
        value: { type: new GraphQLNonNull(GraphQLString) },
        aliases: {type: new GraphQLList(GraphQLString)},
    }),
    name: "ApprovedListItemRead",
});

export const GQLApprovedListSearchCriteria = new GraphQLInputObjectType({
    fields: () => ({
        type: {type: new GraphQLNonNull(GQLApprovedListType) },
        value: { type: GraphQLString },
        search: { type: GraphQLString },
        activeOnly: { type: new GraphQLNonNull(GraphQLBoolean) },
    }),
    name: "ApprovedListSearchCriteria",
});

export const GQLApprovedListQuery = {
    args: {
        criteria: {type: GQLApprovedListSearchCriteria},
    },
    description: "Retrieve list of apporved items.",
    type: new GraphQLList(GQLApprovedListItemRead),
    resolve(_, {criteria}, request) {
          return approvedListService.read(criteria).then((response: IApprovedListItemRead[]) => {
            return response;
        }).catch((error) => {
            console.error(error);
            throw new Error(error);
        });
    },
};
