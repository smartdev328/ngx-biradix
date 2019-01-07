import * as express from "express";
import * as moment from "moment-timezone";
import {IUserLoggedIn} from "../../services/services/users/contracts/IUser";
import {SFTP_ALLIANCE } from "../../../config/settings";
import * as userService from "../../../api/users/services/userService";
import {connect, uploadFile} from "../../ftp/services/ftpService";
import * as exportService from "../../../api/properties/services/exportService";

const routes = express.Router();

routes.get("/", async (req, res) => {
    const systemUser: IUserLoggedIn = await userService.getSystemUserAsync();
    await connect(SFTP_ALLIANCE);

    const data = await exportService.getCsvGroupedAsync(systemUser, "alliance", null);
    const report = Buffer.from(data, "utf8");

    await uploadFile(`/alliance/alliance_${moment().tz("America/Los_Angeles").format("MM_DD_YYYY")}.csv`, report);

    return res.status(200).send("SUCCESS");
});

module.exports = routes;
