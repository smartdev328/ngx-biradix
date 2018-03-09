import * as propertyService from "../../../api/properties/services/propertyService";
import {DataIntegrityCheckType} from "../../audit/enums/DataIntegrityEnums";
import {DataIntegrityViolation} from "../../audit/objects/DataIntegrityViolation";
import {DataIntegrityViolationSet} from "../../audit/objects/DataIntegrityViolationSet";
import {CustomError} from "../../shared/objects/CustomError";
import {IUser} from "../../users/interfaces/IUser";
import {IProperty} from "../interfaces/IProperty";
import {IPropertySearchRequest} from "../interfaces/IPropertySearchRequest";

export class PropertyDataIntegrityViolationService {
    public async getNewPropertyViloations(operator: IUser, newProperty: IProperty): Promise<DataIntegrityViolationSet> {
        return new Promise<DataIntegrityViolationSet>((resolve, reject) => {
            if (newProperty.custom && newProperty.custom.owner) {
              return resolve(null);
            }

            const violationSet = new DataIntegrityViolationSet();
            Promise.all([checkDuplicateGeo(operator, newProperty), checkDuplicateName(operator, newProperty)]).then((violations: DataIntegrityViolation[]) => {
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
}

function checkDuplicateGeo(operator: IUser, newProperty: IProperty): Promise<DataIntegrityViolation> {
    return new Promise<DataIntegrityViolation>((resolve, reject) => {

        const PropertySearchRequest: IPropertySearchRequest = {
            active: true,
            exclude: [newProperty._id.toString()],
            geo: {loc: newProperty.loc, distance: .1},
            hideCustom: true,
            limit: 1,
            select: "name address city state zip",
        };

        propertyService.search(operator, PropertySearchRequest, (errors: CustomError[], properties: IProperty[]) => {
            if (properties.length > 0) {
                const v = new DataIntegrityViolation();
                v.checkType = DataIntegrityCheckType.PROPERTY_GEO_DUPLICATE;
                v.description = `Existing Property Name: ${properties[0].name}<Br>Duplicate Address: ${properties[0].address} ${properties[0].city}, ${properties[0].state} ${properties[0].zip}`;
                resolve(v);
            } else {
                resolve(null);
            }
        });
    });
}

function checkDuplicateName(operator: IUser, newProperty: IProperty): Promise<DataIntegrityViolation> {
    return new Promise<DataIntegrityViolation>((resolve, reject) => {

        const PropertySearchRequest: IPropertySearchRequest = {
            active: true,
            exclude: [newProperty._id.toString()],
            hideCustom: true,
            limit: 1,
            searchExactName: newProperty.name,
            select: "name address city state zip",
        };

        propertyService.search(operator, PropertySearchRequest, (errors: CustomError[], properties: IProperty[]) => {
            if (properties.length > 0) {
                const v = new DataIntegrityViolation();
                v.checkType = DataIntegrityCheckType.PROPERTY_NAME_DUPLICATE;
                v.description = `New Property Address: ${newProperty.address} ${newProperty.city}, ${newProperty.state} ${newProperty.zip}<Br>
                    Duplicate Property Address: ${properties[0].address} ${properties[0].city}, ${properties[0].state} ${properties[0].zip}`;
                resolve(v);
            } else {
                resolve(null);
            }
        });
    });
}
