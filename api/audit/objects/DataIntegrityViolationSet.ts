import {DataIntegrityViolation} from "./DataIntegrityViolation";

export class DataIntegrityViolationSet {
    public violations: DataIntegrityViolation[] = [];
    public approval?: {
        name: string;
        date: Date;
    };
}
