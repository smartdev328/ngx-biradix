export interface IRowToAverage {
    totUnits: number;
    sqft: number;
    rent?: number;
    concessions?: number;
    ner?: number;
    nersqft?: number;
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
            returnRow.ner = (row.rent - row.concessions / 12) * row.totUnits;
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
