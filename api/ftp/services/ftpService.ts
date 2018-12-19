import * as Client from "ssh2-sftp-client";
import * as parse from "csv-parse";

export const sftp = new Client();

export async function connect() {
    await sftp.connect({
        host: "ftp.biradix.com",
        port: "22",
        username: "prodaccess",
        password: "HoldingThisPassword!",
    });
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
