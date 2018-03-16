import {IDataIntegrityViolation} from "./IDataIntegrityViolation";

export interface IDataIntegrityViolationSet {
    violations: IDataIntegrityViolation[];
    approval?: {
        name: string;
        date: Date;
    };
}
