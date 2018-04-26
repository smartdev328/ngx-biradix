import * as express from "express";
import {KeenService} from "../services/keenService";
const routes = express.Router();

routes.put("/", (req, res) => {
    KeenService.recordEvent(req.body);
    return res.status(200).json({success: true});
});

routes.post("/", (req, res) => {
    KeenService.query(req.body.analysis, req.body.parameters).then((result) => {
        return res.status(200).json({result});
    }).catch((errors) => {
        return res.status(200).json({errors});
    });
});

module.exports = routes;
