import {IApprovedListsModel, model, DBModelToReadObject} from "../repository/ApprovedListsRepository";
import {IApprovedListItemRead, IApprovedListItemWrite} from "../objects/ApprovedLists";
import * as mongoose from "mongoose";
import {IUserLoggedIn} from "../../services/services/users/contracts/IUser";
import {IWebContext} from "../../services/library/sharedContracts/IWebContext";
import {IApprovedListSearchCriteria} from "../objects/ApprovedListSearchCriteria";
import * as auditService from "../../../api/audit/services/auditService";
import * as escapeStringRegexp from "escape-string-regexp";

export async function create(operator: IUserLoggedIn, context: IWebContext, item: IApprovedListItemWrite): Promise<IApprovedListItemRead> {
    const m = new model();

    m._id = new mongoose.Types.ObjectId();
    m.aliases = [];
    m.value = item.value;
    m.type = item.type;
    m.searchable = true;

    const isDupe: IApprovedListItemRead[] = await this.read({value: item.value, activeOnly: false, type: item.type});

    if (isDupe && isDupe.length) {
        throw new Error("Duplicate value: " + m.type + ": " + m.value);
    }

    const result: IApprovedListsModel  = await m.save();

    try {
        await auditService.createAsync({
            operator,
            type: "list_item_created",
            description: `${item.type}: ${item.value} - ${item.searchable ? "Added to autocomplete" : "Not added to autocomplete"}`,
            context,
        });
    } catch (error) {
        console.error(error);
    }

    return DBModelToReadObject(result);
}

export async function read(criteria: IApprovedListSearchCriteria): Promise<IApprovedListItemRead[]> {
    const query = model.find({type: criteria.type});

    if (criteria.searchableOnly) {
        query.where("searchable").equals(true);
    }

    if (criteria.value) {
        query.where("value").regex(new RegExp("^" + escapeStringRegexp(criteria.value) + "$", "i"));
    }

    if (criteria.search) {
        query.where("value").regex(new RegExp(escapeStringRegexp(criteria.search), "i"));
    }

    criteria.limit = criteria.limit || 10000;

    query.sort("value");
    query.limit(criteria.limit);

    const result: IApprovedListsModel[]  = await query.exec();
    return result.map((m: IApprovedListsModel) => {
        return DBModelToReadObject(m);
    });
}
