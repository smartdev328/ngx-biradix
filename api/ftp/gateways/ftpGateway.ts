import * as express from "express";
import * as Client from "ssh2-sftp-client";

const routes = express.Router();

routes.get("/files", async (req, res) => {
    const sftp = new Client();
    await sftp.connect({
        host: "ftp.biradix.com",
        port: "22",
        username: "pbbell",
        password: "PByardiUpload!",
    });
    const data = await sftp.list("/pbbell");

    return res.status(200).json({data});
});

module.exports = routes;
