import {DataIntegrityCheckType} from "../../audit/enums/DataIntegrityEnums";
import {DataIntegrityViolation} from "../../audit/objects/DataIntegrityViolation";
import {DataIntegrityViolationSet} from "../../audit/objects/DataIntegrityViolationSet";
import {IMarketSurvey} from "../interfaces/IMarketSurvey";

export class MarketSurveyDataIntegrityViolationService {
    public getChanged(newSurvey: IMarketSurvey, oldSurvey: IMarketSurvey, isUndo: boolean): DataIntegrityViolationSet {
        if (isUndo || !oldSurvey._id) {
            return null;
        }
        const violationSet = new DataIntegrityViolationSet();
        const v = new DataIntegrityViolation();
        v.description = "";

        let n = newSurvey.occupancy || 0;
        let o = oldSurvey.occupancy || 0;
        let d = Math.abs(n - o);

        // diff must be > 0 and starting value must be over 20%
        if (d > 0 && o >= 20) {
            if (d / o >= .5) {
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

        // diff must be > 0 and starting value must be over 20%
        if (d > 0 && o >= 20) {
            if (d / o >= .5) {
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

        // diff must be > 0 and starting value must be over 20%
        if (d > 0 && o >= 20) {
            if (d / o >= .5) {
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

        if (violationSet.violations.length > 0) {
            return violationSet;
        }

        return null;

    }
}

function formatNumber(value: number, decimals: number): string {
    if (typeof value === "undefined" || value === null) {
        return "N/A";
    }

    return value.toFixed(decimals);
}
