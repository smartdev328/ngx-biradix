import {GraphQLBoolean, GraphQLError, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import {OrganizationSettings} from "./OrganizationSettings";

export const Organization = new GraphQLObjectType({
    fields: () => ({
        _id: { type: GraphQLString },
        isDefault: { type: GraphQLBoolean },
        logoBig: { type: GraphQLString },
        logoEmailHeight: { type: GraphQLInt },
        logoSmall: { type: GraphQLString },
        name: { type: GraphQLString },
        settings: { type: OrganizationSettings },
        subdomain: { type: GraphQLString },
    }),
    name: "Organization",
});
