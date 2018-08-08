import * as request from "request";
import * as settings from "../../../config/settings";
import {IWalkScore} from "../interfaces/IWalkScore";

const API_KEY = settings.WALKSCORE_API_KEY;

export class WalkScoreService {
    public static getScore(address: string, lat: number, lon: number): Promise<IWalkScore> {
        return new Promise<IWalkScore>((resolve, reject) => {
            const url = `http://api.walkscore.com/score?format=json&address=${encodeURIComponent(address)}&lat=${lat}&lon=${lon}&transit=1&bike=1&wsapikey=${API_KEY}`;
            request({url, timeout: 1000 * 60 * 60}, (error, response, body) => {
                if (error) {
                    reject({error: error.toString()});
                }
                let resp;
                try {
                    resp = JSON.parse(response.body);
                } catch (ex) {
                    return reject({error: ex.message});
                }

                switch (resp.status) {
                    case 1:
                        resolve({
                            bikescore: resp.bike.score,
                            transitscore: resp.transit.score,
                            walkscore: resp.walkscore,
                        });
                        break;
                    case 2:
                        reject({error: "Score is being calculated and is not currently available."});
                        break;
                    case 30:
                        reject({error: "Invalid latitude/longitude."});
                        break;
                    case 31:
                        reject({error: "Walk Score API internal error."});
                        break;
                    case 40:
                        reject({error: "Your WSAPIKEY is invalid."});
                        break;
                    case 41:
                        reject({error: "Your daily API quota has been exceeded."});
                        break;
                    case 42:
                        reject({error: "Your daily API quota has been exceeded."});
                        break;
                    default:
                        reject({error: "Unknown Error"});
                }
            });
        });
    }
}