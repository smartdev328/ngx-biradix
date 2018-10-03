import {IUserLoggedIn} from "../../services/services/users/contracts/IUser";
import {IWebContext} from "../../services/library/sharedContracts/IWebContext";
import {ApprovedListType} from "../../approvedlists/objects/ApprovedLists";
import * as amenityService from "../../../api/amenities/services/amenityService";
import * as propertyService from "../../../api/properties/services/propertyService";
import * as propertyHelperService from "../../../api/properties/services/PropertyHelperService";
import * as propertyCreateService from "../../../api/properties/services/CreateService";

export async function massUpdate(operator: IUserLoggedIn, context: IWebContext, propertyIds: string[], type: ApprovedListType, newValue: string) {
    if (!propertyIds || propertyIds.length === 0) {
        throw new Error("Missing properties");
    }
    const amenities = await amenityService.searchAsync({});
    const properties = await propertyService.searchAsync(operator, {ids: propertyIds, select: "*", permission: ["CompManage", "PropertyManage"]});
    await asyncForEach(properties, async (property) => {
        switch (type.toLocaleLowerCase()) {
            case ApprovedListType.OWNER.toLocaleLowerCase():
                property.owner = newValue;
                break;
            case ApprovedListType.MANAGER.toLocaleLowerCase():
                property.management = newValue;
                break;
            default:
                throw new Error("Not Implemented");
        }

        propertyHelperService.fixAmenities(property, amenities);
        await propertyCreateService.updateAsync(operator, context, null, property, {skipGeo: true});
    });
    return true;
}

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}
