import {GraphQLBoolean, GraphQLError, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLEnumType, GraphQLInputObjectType } from "graphql";
import * as propertyService from "../../../api/properties/services/propertyService";
import {GQLApprovedListType} from "../../approvedlists/graphql/GQLApprovedListItem";

export const GQLUnapprovedListItem = new GraphQLObjectType({
    fields: () => ({
        id: { type: new GraphQLNonNull(GraphQLString) },
        value: { type: new GraphQLNonNull(GraphQLString) },
        name: { type: new GraphQLNonNull(GraphQLString) },
    }),
    name: "UnapprovedListItem",
});

export const GQLUnapprovedListFrequencyItem = new GraphQLObjectType({
    fields: () => ({
        value: { type: new GraphQLNonNull(GraphQLString) },
        count: { type: new GraphQLNonNull(GraphQLInt) },
    }),
    name: "UnapprovedListFrequencyItem",
});

export const GQLUnapprovedListResponse = new GraphQLObjectType({
    fields: () => ({
        frequency: { type: new GraphQLList(GQLUnapprovedListFrequencyItem) },
        unapproved: { type: new GraphQLList(GQLUnapprovedListItem) },
        total: { type: new GraphQLNonNull(GraphQLInt) },
    }),
    name: "UnapprovedListResponse",
});

export const GQLUnApprovedListQuery = {
    args: {
        type: {type: GQLApprovedListType},
    },
    description: "Retrieve list of un-apporved items.",
    type: GQLUnapprovedListResponse,
    resolve(_, {type}, request) {
        if (!request.user || request.user.permissions.indexOf("Admin") === -1) {
            throw new Error("Access denied.");
        }
        return propertyService.getUnapproved(type).then((response) => {
            return response;
        }).catch((error) => {
            console.error(error);
            throw new Error(error);
        });
    },
};
