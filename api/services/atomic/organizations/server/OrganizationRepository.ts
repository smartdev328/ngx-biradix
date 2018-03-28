import * as mongoose from "mongoose";
import {IOrganization} from "../contracts/IOrganization";

const Schema: mongoose.Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    isDefault: Boolean,
    logoBig: {
        type: String,
    },
    logoSmall: {
        type: String,
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
    public model: mongoose.Model<mongoose.Document>;

    constructor(connection: mongoose.Connection) {
        this.model = connection.model<mongoose.Document>("Organization", Schema);
    }
}
