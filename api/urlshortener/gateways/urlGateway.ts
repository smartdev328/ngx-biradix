import * as express from "express";
import * as md5 from "md5";
import * as redisService from "../../../api/utilities/services/redisService";

const router = express.Router();

router.post("/", (req, res) => {
    if (req.body.url) {
        let key;
        key = md5(req.body.url);

        redisService.set(req.body.url, req.body.url, 30);

        return res.status(200).json({key});
    } else {
        return res.status(200).json({key: ""});
    }
});

export = router;
