import {DataIntegrityCheckType, DataIntegritySearchParameter, DataIntegritySeverity} from "../enums/DataIntegrityEnums";

export interface IDataIntegrityCheck {
    severity: DataIntegritySeverity;
    type: DataIntegrityCheckType;
    name: string;
    searchParameter: DataIntegritySearchParameter;
}
