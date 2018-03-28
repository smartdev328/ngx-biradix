import {IOrganization} from "../contracts/IOrganization";

function _DBtoObject(object: any): IOrganization {
    object.settings = object.settings || {};

    return {
        _id: object._id.toString(),
        name: object.name,
        subdomain: object.subdomain,
        logoBig: object.logoBig,
        logoSmall: object.logoSmall,
        isDefault: object.isDefault,
        settings: {
            updates: object.settings.updates || {
                allow: true,
                configured: false,
                default_value: true,
            },
            how_often: object.settings.how_often || {
                allow: true,
                configured: false,
                default_value: "* * * * 2",
            },
            all_properties: object.settings.all_properties || {
                allow: true,
                configured: false,
                default_value: true,
            },
            reminders: object.settings.reminders || {
                allow: true,
                configured: false,
                default_value: true,
            },
            leased: object.settings.leased || {
                allow: true,
                configured: false,
                default_value: false,
            },
            renewal: object.settings.renewal || {
                allow: true,
                configured: false,
                default_value: false,
            },
            atr: object.settings.atr || {
                allow: true,
                configured: false,
                default_value: false,
            },
            detailed_concessions: object.settings.detailed_concessions || {
                allow: true,
                configured: false,
                default_value: false,
            },

            notification_columns: object.settings.notification_columns || {
                allow: true,
                configured: false,
                default_value: {
                    occupancy: true,
                    leased: false,
                    atr: false,
                    units: true,
                    sqft: true,
                    rent: true,
                    runrate: false,
                    runratesqft: false,
                    ner: true,
                    nersqft: true,
                    nersqftweek: true,
                    nersqftmonth: true,
                    nersqftyear: false,
                    last_updated: true,
                    weekly: false,
                    concessions: false,
                    nervscompavg: false,
                },
            },
        },
    };
}

export function DBtoObject(object: any): IOrganization {
    return _DBtoObject(object);
}

export function DBtoObjectArray(object: any[]): IOrganization[] {
    return object.map((x) => {
        return _DBtoObject(x);
    });
}
