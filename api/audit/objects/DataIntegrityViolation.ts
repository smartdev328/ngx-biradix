import {DataIntegrityCheckType} from "../enums/DataIntegrityEnums";

export class DataIntegrityViolation {
    public dataIntegrityCheckType: DataIntegrityCheckType;
    public description: string;
    public approval: {
        approved: boolean;
        name?: string;
        date?: Date;
    };
}
