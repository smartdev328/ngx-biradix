import {GraphQLBoolean, GraphQLError, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";

const OrganizationSettingString = new GraphQLObjectType({
    fields: () => ({
        allow: { type: GraphQLBoolean },
        configured: { type: GraphQLBoolean },
        default_value: { type: GraphQLString },
    }),
    name: "OrganizationSettingString",
});

const OrganizationSettingBoolean = new GraphQLObjectType({
    fields: () => ({
        allow: { type: GraphQLBoolean },
        configured: { type: GraphQLBoolean },
        default_value: { type: GraphQLBoolean },
    }),
    name: "OrganizationSettingBoolean",
});

const NotificationColumns = new GraphQLObjectType({
    fields: () => ({
        atr: { type: GraphQLBoolean, description: "ATR %" },
        concessions: { type: GraphQLBoolean, description: "Total Concessions" },
        last_updated: { type: GraphQLBoolean, description: "Last Updated" },
        leased: { type: GraphQLBoolean, description: "Leased %" },
        ner: { type: GraphQLBoolean, description: "Net Eff. Rent" },
        nermonth: { type: GraphQLBoolean, description: "NER vs Last Month" },
        nerweek: { type: GraphQLBoolean, description: "NER vs Last Week" },
        neryear: { type: GraphQLBoolean, description: "NER vs Last Year" },
        nersqft: { type: GraphQLBoolean, description: "Net Eff. Rent / Sqft" },
        nersqftmonth: { type: GraphQLBoolean, description: "NER/Sqft vs Last Month" },
        nersqftweek: { type: GraphQLBoolean, description: "NER/Sqft vs Last Week" },
        nersqftyear: { type: GraphQLBoolean, description: "NER/Sqft vs Last Year" },
        nervscompavg: { type: GraphQLBoolean, description: "NER/Sqft vs Comp Avg" },
        occupancy: { type: GraphQLBoolean, description: "Occ. %" },
        rent: { type: GraphQLBoolean, description: "Rent" },
        runrate: { type: GraphQLBoolean, description: "Recurring Rent" },
        runratesqft: { type: GraphQLBoolean, description: "Recurring Rent / Sqft" },
        sqft: { type: GraphQLBoolean, description: "Sqft" },
        units: { type: GraphQLBoolean, description: "Units" },
        weekly: { type: GraphQLBoolean, description: "Traffic & Leases / Week" },
    }),
    name: "NotificationColumnItems",
});

const OrganizationSettingNotificationColumns = new GraphQLObjectType({
    fields: () => ({
        allow: { type: GraphQLBoolean },
        configured: { type: GraphQLBoolean },
        default_value: { type: NotificationColumns },
    }),
    name: "OrganizationSettingNotificationColumns",
});

export const OrganizationSettings = new GraphQLObjectType({
    fields: () => ({
        all_properties: { type: OrganizationSettingBoolean },
        atr: { type: OrganizationSettingBoolean },
        detailed_concessions: { type: OrganizationSettingBoolean },
        how_often: { type: OrganizationSettingString },
        leased: { type: OrganizationSettingBoolean },
        notification_columns: {type: OrganizationSettingNotificationColumns },
        reminders: { type: OrganizationSettingBoolean },
        renewal: { type: OrganizationSettingBoolean },
        updates: { type: OrganizationSettingBoolean },
    }),
    name: "OrganizationSettings",
});
