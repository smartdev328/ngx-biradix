import {IOrganization} from "../contracts/IOrganization";
import {IOrganizationSettings} from "../contracts/IOrganizationSettings";
import {IOrganizationModel} from "./OrganizationRepository";

function _DBtoObject(object: IOrganizationModel): IOrganization {
    const settings: any = object.settings || {};

    return {
        _id: object._id.toString(),
        isDefault: object.isDefault,
        logoBig: object.logoBig,
        logoSmall: object.logoSmall,
        name: object.name,
        settings: {
            all_properties: settings.all_properties || {
                allow: true,
                configured: false,
                default_value: true,
            },
            atr: settings.atr || {
                allow: true,
                configured: false,
                default_value: false,
            },
            detailed_concessions: settings.detailed_concessions || {
                allow: true,
                configured: false,
                default_value: false,
            },
            how_often: settings.how_often || {
                allow: true,
                configured: false,
                default_value: "* * * * 2",
            },
            leased: settings.leased || {
                allow: true,
                configured: false,
                default_value: false,
            },
            notification_columns: settings.notification_columns || {
                allow: true,
                configured: false,
                default_value: {
                    atr: false,
                    concessions: false,
                    last_updated: true,
                    leased: false,
                    ner: true,
                    nersqft: true,
                    nersqftmonth: true,
                    nersqftweek: true,
                    nersqftyear: false,
                    nervscompavg: false,
                    occupancy: true,
                    rent: true,
                    runrate: false,
                    runratesqft: false,
                    sqft: true,
                    units: true,
                    weekly: false,
                },
            },
            reminders: settings.reminders || {
                allow: true,
                configured: false,
                default_value: true,
            },
            renewal: settings.renewal || {
                allow: true,
                configured: false,
                default_value: false,
            },
            updates: settings.updates || {
                allow: true,
                configured: false,
                default_value: true,
            },
        },
        subdomain: object.subdomain,
    };
}

export function DBtoObject(object: IOrganizationModel): IOrganization {
    return _DBtoObject(object);
}

export function DBtoObjectArray(object: IOrganizationModel[]): IOrganization[] {
    return object.map((x) => {
        return _DBtoObject(x);
    });
}
