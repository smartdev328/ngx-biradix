import * as express from "express";
import * as serviceRegistry from "../../services/gateway/ServiceRegistry";

const router = express.Router();

router.post("/", (req: express.Request, res: express.Response) => {
    if (req.body.url) {
        serviceRegistry.getShortenerService().shorten(req.body.url.toString(), 30). then ((key) => {
            return res.status(200).json({key});
        });
    } else {
        return res.status(200).json({key: ""});
    }
});

export = router;
