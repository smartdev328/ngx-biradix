import {DataIntegrityCheckType} from "../enums/DataIntegrityEnums";

export class DataIntegrityViolation {
    public dataIntegrityCheckType: DataIntegrityCheckType;
    public description: string;
}
