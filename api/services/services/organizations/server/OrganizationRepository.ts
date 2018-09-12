import * as mongoose from "mongoose";
import {IOrganizationSettings} from "../contracts/IOrganizationSettings";

interface IDBOrganization {
    name: string;
    subdomain: string;
    logoBig: string;
    logoSmall: string;
    logoEmailHeight?: number;
    isDefault: boolean;
    settings?: IOrganizationSettings;
}

export interface IOrganizationModel extends IDBOrganization, mongoose.Document {

}

const Schema: mongoose.Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    isDefault: Boolean,
    logoBig: {
        type: String,
    },
    logoSmall: {
        type: String,
    },
    logoEmailHeight: {
        type: Number,
    },
    name: {
        type: String,
    },
    settings: {},
    subdomain: {
        type: String,
    },
});

export class Repository {
    public model: mongoose.Model<IOrganizationModel>;

    constructor(connection: mongoose.Connection) {
        this.model = connection.model<IOrganizationModel>("Organization", Schema);
    }
}
