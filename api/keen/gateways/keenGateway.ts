import * as express from "express";
import {KeenService} from "../services/keenService";
const routes = express.Router();

routes.put("/", (req, res) => {
    KeenService.recordEvent(req.body);
    return res.status(200).json({success: true});
});

module.exports = routes;
