import * as _ from "lodash";
import {connect, csvParse, downloadFile, sftp} from "./ftpService";

export async function parseFloorplans(folder: string, date: string) {
    let data = await sftp.list(folder);

    data = data.map((row) => row.name);
    let propertiesFile = "";

    data.forEach((fileName) => {
        if (fileName.indexOf("UnitType_" + date) > -1) {

            propertiesFile = fileName;
        }
    });

    const body = await downloadFile(folder + "/" + propertiesFile);
    const unitTypes = await csvParse(body);
    let unitTypesObjects = [];

    unitTypes.forEach((row) => {
        unitTypesObjects.push({
            yardiId: row[0],
            propertyYardiId: row[2],
            description: row[3],
            sqft: parseInt(row[6], 10),
            bedrooms: row[7],
            bathrooms: parseInt(row[8], 10),

        });
    });

    unitTypesObjects = _.sortByAll(unitTypesObjects, ["bedrooms", "bathrooms", "sqft", "description", "units"]);
    return unitTypesObjects;
}

export async function parseProperties(folder: string, date: string) {
    let data = await sftp.list(folder);

    data = data.map((row) => row.name);
    let propertiesFile = "";

    data.forEach((fileName) => {
        if (fileName.indexOf("Property_" + date) > -1) {

            propertiesFile = fileName;
        }
    });

    const body = await downloadFile(folder + "/" + propertiesFile);
    const properties = await csvParse(body);
    const propertiesObjects = [];

    properties.forEach((row) => {
       propertiesObjects.push({
           name: row[2],
           address: row[3],
           city: row[5],
           state: row[6],
           zip: row[7],
           yardiId: row[0],
       });
    });

    return propertiesObjects;
}

export async function parseDates(folder: string): Promise<string[]> {
    let data = await sftp.list(folder);

    data = data.map((row) => row.name);
    const dates = {};
    const pattern = /_([0-9]{8})T/;
    let matches;
    data.forEach((fileName) => {
        matches = fileName.match(pattern);
        if (matches && matches.length > 1) {
            dates[matches[1]] = true;
        }
    });

    let datearray: string[] = Object.keys(dates).map((date) => date);
    datearray = _.sortBy(datearray, (row) => {
        return -1 * parseInt(row, 10);
    });

    return datearray;
}
