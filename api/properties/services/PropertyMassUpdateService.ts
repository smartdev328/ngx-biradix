import {IUserLoggedIn} from "../../services/services/users/contracts/IUser";
import {IWebContext} from "../../services/library/sharedContracts/IWebContext";
import {ApprovedListType, ApprovedListTypeMap} from "../../approvedlists/objects/ApprovedLists";
import * as amenityService from "../../../api/amenities/services/amenityService";
import * as propertyService from "../../../api/properties/services/propertyService";
import * as propertyHelperService from "../../../api/properties/services/propertyHelperService";
import * as propertyCreateService from "../../../api/properties/services/createService";
import * as auditService from "../../../api/audit/services/auditService";

export async function massUpdate(operator: IUserLoggedIn, context: IWebContext, propertyIds: string[], type: ApprovedListType, newValue: string, oldValue: string) {
    if (!propertyIds || propertyIds.length === 0) {
        throw new Error("Missing properties");
    }
    const amenities = await amenityService.searchAsync({});
    const properties = await propertyService.searchAsync(operator, {ids: propertyIds, select: "*", permission: ["CompManage", "PropertyManage"]});
    const data = [{description: "Properties Affected:", id: null}];
    await asyncForEach(properties, async (property) => {
        data.push({description: property.name, id: property._id});
    });

    await asyncForEach(properties, async (property) => {
        switch (type) {
            case ApprovedListType.OWNER:
                property.owner = newValue;
                break;
            case ApprovedListType.MANAGER:
                property.management = newValue;
                break;
            default:
                throw new Error("Not Implemented");
        }

        propertyHelperService.fixAmenities(property, amenities);
        await propertyCreateService.updateAsync(operator, context, null, property, {skipGeo: true});
    });

    await auditService.createAsync({
        operator,
        type: "unapproved_item_mapped",
        description: `${ApprovedListTypeMap[type]} value, "${oldValue}" => "${newValue}"`,
        context,
        data,
    });

    return true;
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
