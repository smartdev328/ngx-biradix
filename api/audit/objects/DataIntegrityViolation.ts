import {DataIntegrityCheckType} from "../enums/DataIntegrityEnums";

export class DataIntegrityViolation {
    public checkType: DataIntegrityCheckType;
    public description: string;
}
