export interface IOrganizationSettings {
    updates: {
        allow: boolean,
        configured: boolean,
        default_value: boolean,
    };
    how_often: {
        allow: boolean,
        configured: boolean,
        default_value: string,
    };
    all_properties: {
        allow: boolean,
        configured: boolean,
        default_value: boolean,
    };
    reminders: {
        allow: boolean,
        configured: boolean,
        default_value: boolean,
    };
    leased: {
        allow: boolean,
        configured: boolean,
        default_value: boolean,
    };
    renewal: {
        allow: boolean,
        configured: boolean,
        default_value: boolean,
    };
    atr: {
        allow: boolean,
        configured: boolean,
        default_value: boolean,
    };
    detailed_concessions: {
        allow: boolean,
        configured: boolean,
        default_value: boolean,
    };
    notification_columns: {
        allow: boolean,
        configured: boolean,
        default_value: {
            occupancy: boolean,
            leased: boolean,
            atr: boolean,
            units: boolean,
            sqft: boolean,
            rent: boolean,
            runrate: boolean,
            runratesqft: boolean,
            ner: boolean,
            nersqft: boolean,
            nersqftweek: boolean,
            nersqftmonth: boolean,
            nersqftyear: boolean,
            last_updated: boolean,
            weekly: boolean,
            concessions: boolean,
            nervscompavg: boolean,
        },
    };
}
