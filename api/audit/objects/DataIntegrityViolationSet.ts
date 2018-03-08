import {DataIntegrityViolation} from "./DataIntegrityViolation";

export class DataIntegrityViolationSet {
    public violations: DataIntegrityViolation[] = [];
    public approval?: {
        approved: boolean;
        name: string;
        date: Date;
    };
}
