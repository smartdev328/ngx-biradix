import {GraphQLBoolean, GraphQLError, GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";

export const OrganizationSearchCriteria = new GraphQLInputObjectType({
    fields: () => ({
        _id: { type: GraphQLString },
        isDefault: { type: GraphQLBoolean },
        subdomain: { type: GraphQLString },
    }),
    name: "OrganizationSearchCriteria",
});
