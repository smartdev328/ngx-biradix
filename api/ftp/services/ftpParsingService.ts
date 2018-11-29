import * as _ from "lodash";
import {connect, csvParse, downloadFile, sftp} from "./ftpService";

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

    return properties;
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
