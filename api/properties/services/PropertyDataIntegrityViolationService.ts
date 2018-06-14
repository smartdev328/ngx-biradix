import * as propertyService from "../../../api/properties/services/propertyService";
import {DataIntegrityCheckType} from "../../audit/enums/DataIntegrityEnums";
import {IDataIntegrityViolation} from "../../audit/interfaces/IDataIntegrityViolation";
import {IDataIntegrityViolationSet} from "../../audit/interfaces/IDataIntegrityViolationSet";
import {ICustomError} from "../../services/library/sharedContracts/ICustomError";
import {IUserLoggedIn} from "../../services/services/users/contracts/IUser";
import {IProperty} from "../interfaces/IProperty";
import {IPropertySearchRequest} from "../interfaces/IPropertySearchRequest";

export class PropertyDataIntegrityViolationService {
    public getFloorplansChanged(reason: string, isUndo: boolean): IDataIntegrityViolationSet {
        if (isUndo) {
            return null;
        }
        const v: IDataIntegrityViolation = {
            checkType: DataIntegrityCheckType.PROPERTY_FLOOR_PLANS_CHANGE,
            description: reason,
        };

        const violationSet: IDataIntegrityViolationSet = {
            violations: [v],
        };

        return violationSet;
    }

    public async getNewPropertyViloations(operator: IUserLoggedIn, newProperty: IProperty): Promise<IDataIntegrityViolationSet> {
        return new Promise<IDataIntegrityViolationSet>((resolve, reject) => {
            if (newProperty.custom && newProperty.custom.owner) {
              return resolve(null);
            }

            const violationSet: IDataIntegrityViolationSet = {
                violations: [],
            };

            Promise.all([checkDuplicateGeo(operator, newProperty), checkDuplicateName(operator, newProperty)]).then((violations: IDataIntegrityViolation[]) => {
                if (violations[0] || violations[1]) {

                    if (violations[0]) {
                        violationSet.violations.push(violations[0]);
                    }
                    if (violations[1]) {
                        violationSet.violations.push(violations[1]);
                    }

                    resolve(violationSet);
                } else {
                    resolve(null);
                }
            });
        });
    }

    public async getUpdatePropertyViloations(operator: IUserLoggedIn, newProperty: IProperty, oldProperty: IProperty, isUndo: boolean): Promise<IDataIntegrityViolationSet> {
        return new Promise<IDataIntegrityViolationSet>((resolve, reject) => {
            if (newProperty.custom && newProperty.custom.owner) {
                return resolve(null);
            }

            if (isUndo) {
                return resolve(null);
            }

            const violationSet: IDataIntegrityViolationSet = {
                violations: [],
            };

            Promise.all([
                checkDuplicateGeo(operator, newProperty),
                checkDuplicateName(operator, newProperty),
                checkAddressChange(newProperty, oldProperty),
            ]).then((violations: IDataIntegrityViolation[]) => {
                if (violations[0] || violations[1]) {
                    if (violations[0]) {
                        violationSet.violations.push(violations[0]);
                    }
                    if (violations[1]) {
                        violationSet.violations.push(violations[1]);
                    }
                    if (violations[2]) {
                        violationSet.violations.push(violations[2]);
                    }
                    resolve(violationSet);
                } else {
                    resolve(null);
                }
            });
        });
    }
}

function checkDuplicateGeo(operator: IUserLoggedIn, newProperty: IProperty): Promise<IDataIntegrityViolation> {
    return new Promise<IDataIntegrityViolation>((resolve, reject) => {

        const PropertySearchRequest: IPropertySearchRequest = {
            active: true,
            exclude: [newProperty._id.toString()],
            geo: {loc: newProperty.loc, distance: .1},
            hideCustom: true,
            limit: 10,
            select: "name address city state zip",
        };

        propertyService.search(operator, PropertySearchRequest, (errors: ICustomError[], properties: IProperty[]) => {
            if (properties.length > 0) {
                const v: IDataIntegrityViolation = {
                    checkType: DataIntegrityCheckType.PROPERTY_GEO_DUPLICATE,
                    description: `Created Property: ${newProperty.name}, ${newProperty.address} ${newProperty.city}, ${newProperty.state} ${newProperty.zip}`,
                };

                properties.forEach((property) => {
                    v.description += `<Br>Existing Property: ${property.name}, ${property.address} ${property.city}, ${property.state} ${property.zip}`;
                });

                resolve(v);
            } else {
                resolve(null);
            }
        });
    });
}

function checkAddressChange(newProperty: IProperty, oldProperty: IProperty): Promise<IDataIntegrityViolation> {
    return new Promise<IDataIntegrityViolation>((resolve, reject) => {
        if (newProperty.address.toLowerCase() !== oldProperty.address.toLowerCase()) {
            const v: IDataIntegrityViolation = {
                checkType: DataIntegrityCheckType.PROPERTY_ADDRESS_CHANGE,
                description: `New Property Address: ${newProperty.address} ${newProperty.city}, ${newProperty.state} ${newProperty.zip}<Br>
                    Previous Property Address: ${oldProperty.address} ${oldProperty.city}, ${oldProperty.state} ${oldProperty.zip}`,
            };
            resolve(v);
        } else {
            resolve(null);
        }
    });
}

function checkDuplicateName(operator: IUserLoggedIn, newProperty: IProperty): Promise<IDataIntegrityViolation> {
    return new Promise<IDataIntegrityViolation>((resolve, reject) => {

        const PropertySearchRequest: IPropertySearchRequest = {
            active: true,
            exclude: [newProperty._id.toString()],
            hideCustom: true,
            limit: 1,
            searchExactName: newProperty.name,
            select: "name address city state zip",
        };

        propertyService.search(operator, PropertySearchRequest, (errors: ICustomError[], properties: IProperty[]) => {
            if (properties.length > 0) {
                const v: IDataIntegrityViolation = {
                    checkType: DataIntegrityCheckType.PROPERTY_NAME_DUPLICATE,
                    description: `New Property Address: ${newProperty.address} ${newProperty.city}, ${newProperty.state} ${newProperty.zip}<Br>
                    Duplicate Property Address: ${properties[0].address} ${properties[0].city}, ${properties[0].state} ${properties[0].zip}`,
                };

                resolve(v);
            } else {
                resolve(null);
            }
        });
    });
}
