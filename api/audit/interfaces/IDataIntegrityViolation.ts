import {DataIntegrityCheckType} from "../enums/DataIntegrityEnums";

export interface IDataIntegrityViolation {
    checkType: DataIntegrityCheckType;
    description: string;
}
