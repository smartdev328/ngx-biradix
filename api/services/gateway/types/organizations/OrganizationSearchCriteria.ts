import {GraphQLError, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";

export const OrganizationSearchCriteria = new GraphQLInputObjectType({
    fields: () => ({
        subdomain: { type: GraphQLString },
    }),
    name: "OrganizationSearchRequest",
});
