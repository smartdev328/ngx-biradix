export interface IRowToAverage {
    totUnits: number;
    sqft: number;
    rent?: number;
    concessions?: number;
    ner?: number;
    nersqft?: number;
}

export interface IPropertyLevelRowToAverage {
    totUnits: number;
    occupancy?: number;
    leased?: number;
    weeklytraffic?: number;
    weeklyleases?: number;
}
export function averagePropertyLevel(rows: IPropertyLevelRowToAverage[]): IPropertyLevelRowToAverage {
    const returnRow: IPropertyLevelRowToAverage = {
        totUnits: 0,
    };
    let occupancyCounts = 0;
    let trafficCounts = 0;
    let weeklyCounts = 0;
    let leasedCounts = 0;

    rows.forEach((row: IPropertyLevelRowToAverage) => {
        returnRow.totUnits += row.totUnits;
        if (typeof row.occupancy !== "undefined" && row.occupancy !== null && !isNaN(row.occupancy)) {
            occupancyCounts += row.totUnits;
            returnRow.occupancy = (returnRow.occupancy || 0) + row.occupancy * row.totUnits;
        }
        if (typeof row.leased !== "undefined" && row.leased !== null && !isNaN(row.leased)) {
            leasedCounts += row.totUnits;
            returnRow.leased = (returnRow.leased || 0) + row.leased * row.totUnits;
        }
        if (typeof row.weeklytraffic !== "undefined" && row.weeklytraffic !== null && !isNaN(row.weeklytraffic)) {
            trafficCounts += row.totUnits;
            returnRow.weeklytraffic = (returnRow.weeklytraffic || 0) + row.weeklytraffic * row.totUnits;
        }
        if (typeof row.weeklyleases !== "undefined" && row.weeklyleases !== null && !isNaN(row.weeklyleases)) {
            weeklyCounts += row.totUnits;
            returnRow.weeklyleases = (returnRow.weeklyleases || 0) + row.weeklyleases * row.totUnits;
        }
    });

    if (occupancyCounts) {
        returnRow.occupancy /= occupancyCounts;
    }

    if (leasedCounts) {
        returnRow.leased /= leasedCounts;
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
