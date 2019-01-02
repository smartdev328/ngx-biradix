export interface IRowToAverage {
    totUnits: number;
    sqft: number;
    rent?: number;
    concessions?: number;
    ner?: number;
    nersqft?: number;
}

export interface IPropertyLevelRowToAverage {
    occupancy?: number;
    weeklytraffic?: number;
    weeklyleases?: number;
}
export function averagePropertyLevel(rows: IPropertyLevelRowToAverage[]): IPropertyLevelRowToAverage {
    const returnRow: IPropertyLevelRowToAverage = {

    };
    let occupancyCounts = 0;
    let trafficCounts = 0;
    let weeklyCounts = 0;

    rows.forEach((row: IPropertyLevelRowToAverage) => {
        if (typeof row.occupancy !== "undefined" && row.occupancy !== null && !isNaN(row.occupancy)) {
            occupancyCounts++;
            returnRow.occupancy = (returnRow.occupancy || 0) + row.occupancy;
        }
        if (typeof row.weeklytraffic !== "undefined" && row.weeklytraffic !== null && !isNaN(row.weeklytraffic)) {
            trafficCounts++;
            returnRow.weeklytraffic = (returnRow.weeklytraffic || 0) + row.weeklytraffic;
        }
        if (typeof row.weeklyleases !== "undefined" && row.weeklyleases !== null && !isNaN(row.weeklyleases)) {
            weeklyCounts++;
            returnRow.weeklyleases = (returnRow.weeklyleases || 0) + row.weeklyleases;
        }
    });

    if (occupancyCounts) {
        returnRow.occupancy /= occupancyCounts;
    }

    if (trafficCounts) {
        returnRow.weeklytraffic /= trafficCounts;
    }

    if (weeklyCounts) {
        returnRow.weeklyleases /= weeklyCounts;
    }
    return returnRow;
}

export function average(rows: IRowToAverage[]): IRowToAverage {
    const returnRow: IRowToAverage = {
      totUnits: 0,
      sqft: 0,
    };

    let rentUnits: number = 0;
    rows.forEach((row: IRowToAverage) => {
        returnRow.totUnits += row.totUnits;
        returnRow.sqft += row.totUnits * row.sqft;

        if (row.rent) {
            returnRow.rent = returnRow.rent || 0;
            returnRow.concessions = returnRow.concessions || 0;
            returnRow.ner = returnRow.ner || 0;
            rentUnits += row.totUnits;
            returnRow.rent += row.totUnits * row.rent;
            returnRow.concessions += row.totUnits * row.concessions;
            returnRow.ner += (row.rent - row.concessions / 12) * row.totUnits;
        }
    });
    if (returnRow.totUnits) {
        returnRow.sqft /= returnRow.totUnits;
    }

    if (rentUnits) {
        returnRow.rent /= rentUnits;
        returnRow.concessions /= rentUnits;
        returnRow.ner /= rentUnits;
        returnRow.nersqft = returnRow.ner / returnRow.sqft;
    }

    return returnRow;
}
