import {DataIntegrityViolation} from "./DataIntegrityViolation";

export class DataIntegrityViolations {
    public violations: DataIntegrityViolation[] = [];
    public approval?: {
        approved: boolean;
        name: string;
        date: Date;
    };
}
