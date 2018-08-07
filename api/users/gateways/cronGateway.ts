import * as express from "express";
const routes = express.Router();
import * as userService from "../../../api/users/services/userService";
import {ICustomError} from "../../services/library/sharedContracts/ICustomError";
import {IUserSearchCriteria} from "../interfaces/IUserSearchCriteria";

routes.get("/clear_spam", (req, res) => {

    userService.getSystemUser((obj) => {
        const SystemUser = obj.user;

        const UserSearchCriteria: IUserSearchCriteria = {
            bounceReason: "spam",
            select: "name bounceReason bounceDate",
        };
        let removed: number = 0;
        let remove;
        let hours;
        userService.search(SystemUser, UserSearchCriteria, (errorsUser: ICustomError[], users: any) => {
            remove = false;
            users.forEach((u) => {
                if (!u.bounceDate) {
                    remove = true;
                    removed++;
                } else {
                    hours = ((new Date()).getTime() - (new Date(u.bounceDate)).getTime()) / 1000 / 60 / 60;

                    if (hours >= 3) {
                        remove = true;
                        removed++;
                    }
                }

                if (remove) {
                    userService.resetBounce(SystemUser, {ip: "127.0.0.1", user_agent: "server"}, u._id, (err, updated) => { });
                }
            });
            return res.status(200).json({total: users.length, removed});
        });
    });

});

module.exports = routes;
