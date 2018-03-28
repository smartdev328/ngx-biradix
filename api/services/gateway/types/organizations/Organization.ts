import {GraphQLBoolean, GraphQLError, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";

export const organization = new GraphQLObjectType({
    fields: () => ({
        _id: { type: GraphQLString },
        isDefault: { type: GraphQLBoolean },
        logoBig: { type: GraphQLString },
        logoSmall: { type: GraphQLString },
        name: { type: GraphQLString },
        subdomain: { type: GraphQLString },
    }),
    name: "Organization",
});
