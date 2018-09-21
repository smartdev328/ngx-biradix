import * as mongoose from "mongoose";
import {IApprovedListItemRead, IApprovedListItemWrite} from "../objects/ApprovedLists";

export interface IApprovedListsModel extends IApprovedListItemWrite, mongoose.Document {
    _id: mongoose.Types.ObjectId;
    active: boolean;
    aliases: string[];
}

const ApprovedListsSchema: mongoose.Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    aliases: [String],
    active: Boolean,
    type: {
        type: String,
    },
    value: {
        type: String,
    },
 });

export const model: mongoose.Model<IApprovedListsModel> = mongoose.model<IApprovedListsModel>("ApprovedLists", ApprovedListsSchema);

export function DBModelToReadObject(dbModel: IApprovedListsModel): IApprovedListItemRead {
    const object: IApprovedListItemRead = {
        id: dbModel._id.toString(),
        value: dbModel.value,
        type: dbModel.type,
        aliases: dbModel.aliases,
        active: dbModel.active,
    };

    return object;
}
