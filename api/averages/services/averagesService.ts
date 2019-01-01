export interface IRowToAverage {
    totUnits: number;
    sqft: number;
    rent?: number;
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
            rentUnits += row.totUnits;
            returnRow.rent += row.totUnits * row.rent;
        }
    });

    if (returnRow.totUnits) {
        returnRow.sqft /= returnRow.totUnits;
    }

    if (rentUnits) {
        returnRow.rent /= rentUnits;
    }

    return returnRow;
}
