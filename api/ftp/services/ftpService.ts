import * as Client from "ssh2-sftp-client";
import * as parse from "csv-parse";
import * as url from "url";

export const sftp = new Client();

export async function connect(connectiongString: string) {

    const ftpUrl = url.parse(connectiongString);

    await sftp.connect({
        host: ftpUrl.hostname,
        port: ftpUrl.port,
        username: ftpUrl.auth.split(":")[0],
        password: ftpUrl.auth.split(":")[1],
    });
}

export async function disconnect() {
    await sftp.end();
}

export async function uploadFile(path: string, contents: Buffer): Promise<boolean> {
    await sftp.put(contents, path);
    return true;
}

export async function downloadFile(path: string): Promise<string> {
    let body = "";
    const fileStream = await sftp.get(path);

    const endPromise = new Promise((resolve, reject) => {
        fileStream.on("data", (chunk) => {
            body += chunk;
        });
        fileStream.on("end", () => resolve(body));
        fileStream.on("error", reject); // or something like that
    });

    await endPromise;
    return body;
}

export async function csvParse(csvData: string) {
    const output = [];

    const endPromise = new Promise((resolve, reject) => {
        parse(csvData, {
            trim: true,
            skip_empty_lines: true,
            from: 2,
        })
        // Use the readable stream api
        .on("readable", function() {
            let record;
            while (record = this.read()) {
                output.push(record);
            }
        })
        // When we are done, test that the parsed output matched what expected
        .on("end", () => {
            resolve(output);
        })
        .on("error", reject);
    });

    await endPromise;
    return output;
}
