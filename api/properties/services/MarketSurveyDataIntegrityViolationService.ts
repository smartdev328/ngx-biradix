import {DataIntegrityCheckType} from "../../audit/enums/DataIntegrityEnums";
import {IDataIntegrityViolation} from "../../audit/interfaces/IDataIntegrityViolation";
import {IDataIntegrityViolationSet} from "../../audit/interfaces/IDataIntegrityViolationSet";
import {IMarketSurvey} from "../interfaces/IMarketSurvey";
import {IMarketSurveyFloorplan} from "../interfaces/IMarketSurveyFloorplan";

export class MarketSurveyDataIntegrityViolationService {
    public getChanged(newSurvey: IMarketSurvey, oldSurvey: IMarketSurvey, isUndo: boolean): IDataIntegrityViolationSet {
        if (isUndo || !oldSurvey._id) {
            return null;
        }
        const violationSet: IDataIntegrityViolationSet = {
            violations: [],
        };

        let v: IDataIntegrityViolation = {
            checkType: null,
            description: "",
        };

        let n = newSurvey.occupancy || 0;
        let o = oldSurvey.occupancy || 0;
        let d = Math.abs(n - o);

        // diff must be > 0 and Rule doesn't apply when starting values and ending values are between 1% and 50%. (0% ending value still triggers alert)
        if (d > 0 && (o < 1 || o > 50 || n < 1 || n > 50)) {
            if (o === 0 || d / o >= .5) {
                v.checkType = DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_50;
                v.description += `Occupancy: ${formatNumber(oldSurvey.occupancy, 1)}% =&gt; ${formatNumber(newSurvey.occupancy, 1)}%<br>`;
            } else if (d / o >= .25) {
                v.checkType = DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_25;
                v.description += `Occupancy: ${formatNumber(oldSurvey.occupancy, 1)}% =&gt; ${formatNumber(newSurvey.occupancy, 1)}%<br>`;
            }
        }

        n = newSurvey.leased || 0;
        o = oldSurvey.leased || 0;
        d = Math.abs(n - o);

        // diff must be > 0 and Rule doesn't apply when starting values and ending values are between 1% and 50%. (0% ending value still triggers alert)
        if (d > 0 && (o < 1 || o > 50 || n < 1 || n > 50)) {
            if (o === 0 || d / o >= .5) {
                v.checkType = DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_50;
                v.description += `Leased: ${formatNumber(oldSurvey.leased, 1)}% =&gt; ${formatNumber(newSurvey.leased, 1)}%<br>`;
            } else if (d / o >= .25 && v.checkType !== DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_50) {
                v.checkType = DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_25;
                v.description += `Leased: ${formatNumber(oldSurvey.leased, 1)}% =&gt; ${formatNumber(newSurvey.leased, 1)}%<br>`;
            }
        }

        n = newSurvey.atr || 0;
        o = oldSurvey.atr || 0;
        d = Math.abs(n - o);

        // diff must be > 0 and Rule doesn't apply when starting values and ending values are between 1% and 50%. (0% ending value still triggers alert)
        if (d > 0 && (o < 1 || o > 50 || n < 1 || n > 50)) {
            if (o === 0 || d / o >= .5) {
                v.checkType = DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_50;
                v.description += `ATR: ${formatNumber(oldSurvey.atr, 0)} =&gt; ${formatNumber(newSurvey.atr, 0)}<br>`;
            } else if (d / o >= .25 && v.checkType !== DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_50) {
                v.checkType = DataIntegrityCheckType.OCCUPANCY_LEASE_ATR_CHANGED_25;
                v.description += `ATR: ${formatNumber(oldSurvey.atr, 0)} =&gt; ${formatNumber(newSurvey.atr, 0)}<br>`;
            }
        }

        if (v.description !== "") {
           violationSet.violations.push(v);
        }

        /* Separate violation for NER */

        v = {
            checkType: null,
            description: "",
        };

        const totalUnitsNew: number = calculateTotalUnits(newSurvey.floorplans);
        const totalUnitsOld: number = calculateTotalUnits(oldSurvey.floorplans);

        if (totalUnitsNew > 0 || totalUnitsOld > 0) {
            n = calculateNER(newSurvey.floorplans, totalUnitsNew);
            o = calculateNER(oldSurvey.floorplans, totalUnitsOld);
            d = Math.abs(n - o);

            // diff must be > 0
            if (d > 0 && o >= 0) {
                if (d / o >= .5) {
                    v.checkType = DataIntegrityCheckType.NER_CHANGED_50;
                    v.description += `NER: \$${formatNumber(o, 0)} =&gt; \$${formatNumber(n, 0)}<br>`;
                } else if (d / o >= .25) {
                    v.checkType = DataIntegrityCheckType.NER_CHANGED_25;
                    v.description += `NER: \$${formatNumber(o, 0)} =&gt; \$${formatNumber(n, 0)}<br>`;
                }

                // Take calcuated weighted average NER and divice my weighted average SQFT
                const sqftNew = calculateSQFT(newSurvey.floorplans, totalUnitsNew);
                const sqftOld = calculateSQFT(oldSurvey.floorplans, totalUnitsOld);
                n = n / sqftNew;
                o = o / sqftOld;

                d = Math.abs(n - o);

                if (d > 0 && o >= 0) {
                    if (d / o >= .5) {
                        v.checkType = DataIntegrityCheckType.NER_CHANGED_50;
                        v.description += `NER/Sqft: \$${formatNumber(o, 2)} =&gt; \$${formatNumber(n, 2)}<br>`;
                    } else if (d / o >= .25 && v.checkType !== DataIntegrityCheckType.NER_CHANGED_50) {
                        v.checkType = DataIntegrityCheckType.NER_CHANGED_25;
                        v.description += `NER/Sqft: \$${formatNumber(o, 2)} =&gt; \$${formatNumber(n, 2)}<br>`;
                    }
                }
            }
        }

        if (v.description !== "") {
            violationSet.violations.push(v);
        }

        if (violationSet.violations.length > 0) {
            return violationSet;
        }

        return null;

    }
}

function calculateTotalUnits(floorplans: IMarketSurveyFloorplan[]): number {
    let result = 0;
    floorplans.map((x) => x.units).forEach((x) => result += x);
    return result;
}

function calculateNER(floorplans: IMarketSurveyFloorplan[], totalUnits: number): number {
    let result = 0;
    floorplans.map((x) => x.units * (x.rent - x.concessions / 12)).forEach((x) => result += x);

    result /= totalUnits;

    return result;
}

function calculateSQFT(floorplans: IMarketSurveyFloorplan[], totalUnits: number): number {
    let result = 0;
    floorplans.map((x) => x.units * x.sqft).forEach((x) => result += x);

    result /= totalUnits;

    return result;
}

function formatNumber(value: number, decimals: number): string {
    if (typeof value === "undefined" || value === null) {
        return "(no value set)";
    }

    return value.toFixed(decimals);
}
