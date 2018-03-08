import {DataIntegrityCheckType, DataIntegritySearchParameter, DataIntegritySeverity} from "../enums/DataIntegrityEnums";

export class DataIntegrityCheck {
    public severity: DataIntegritySeverity;
    public type: DataIntegrityCheckType;
    public name: string;
    public searchParameter: DataIntegritySearchParameter;
}
