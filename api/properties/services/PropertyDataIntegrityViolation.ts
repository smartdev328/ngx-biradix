import * as propertyService from "../../../api/properties/services/propertyService";
import {DataIntegrityCheckType} from "../../audit/enums/DataIntegrityEnums";
import {DataIntegrityViolation} from "../../audit/objects/DataIntegrityViolation";
import {IUser} from "../../users/interfaces/IUser";
import {IProperty} from "../interfaces/IProperty";
import {IPropertySearchRequest} from "../interfaces/IPropertySearchRequest";

export class PropertyDataIntegrityViolationService {
    public getNewPropertyViloations(operator: IUser, newProperty: IProperty) {
        return new Promise<DataIntegrityViolation[]>((resolve, reject) => {
            if (newProperty.custom && newProperty.custom.owner) {
              return resolve([]);
            }

            const PropertySearchRequest: IPropertySearchRequest = {
                active: true,
                exclude: newProperty._id,
                geo: {loc: newProperty.loc, distance: .1},
                hideCustom: true,
                limit: 1,
                select: "name address city state zip",
            };

            const violations: DataIntegrityViolation[] = [];

            propertyService.search(operator, PropertySearchRequest, (errors, properties: IProperty[]) => {
                if (properties.length > 0) {
                    const v = new DataIntegrityViolation();
                    v.dataIntegrityCheckType = DataIntegrityCheckType.PROPERTY_GEO_DUPLICATE;
                    v.description = `New Property name: ${newProperty.name}<Br>
                    Existing Property Name: ${properties[0].name}<Br>
                    Duplicate Address: ${properties[0].address} ${properties[0].city}, ${properties[0].state} ${properties[0].zip}`;
                    violations.push(v);
                }
                resolve(violations);
            });
        });
    }
}
