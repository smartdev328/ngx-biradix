import {DataIntegrityCheckType, DataIntegritySearchParameter, DataIntegritySeverity} from "../enums/DataIntegrityEnums";
import {DataIntegrityCheck} from "./DataIntegrityCheck";

const DataIntegrityChecks: DataIntegrityCheck[] = [
    {severity: DataIntegritySeverity.HIGH, type: DataIntegrityCheckType.PROPERTY_GEO_DUPLICATE, name: "Property Geo Duplicate", searchParameter: DataIntegritySearchParameter.PROPERTY},
    {severity: DataIntegritySeverity.MEDIUM, type: DataIntegrityCheckType.PROPERTY_NAME_DUPLICATE, name: "Property Name Duplicate", searchParameter: DataIntegritySearchParameter.PROPERTY},
    {severity: DataIntegritySeverity.HIGH, type: DataIntegrityCheckType.PROPERTY_ADDRESS_CHANGE, name: "Property Address Changed", searchParameter: DataIntegritySearchParameter.PROPERTY},
    {severity: DataIntegritySeverity.MEDIUM, type: DataIntegrityCheckType.PROPERTY_FLOOR_PLANS_CHANGE, name: "Property Floor Plans Changed", searchParameter: DataIntegritySearchParameter.PROPERTY},
];

export = DataIntegrityChecks;
