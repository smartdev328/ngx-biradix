import * as Keen from "keen-js";
import * as settings from "../../../config/settings";
import {IEvent} from "../interfaces/IEvents";

const helpers = Keen.helpers;
const utils = Keen.utils;

const keen = new Keen({
    projectId: settings.KEEN_PROJECT_ID,
    readKey: settings.KEEN_READ_KEY,
    writeKey: settings.KEEN_WRITE_KEY,
});

export class KeenService {
    public static recordEvent(event: IEvent) {
        event.payload.env = settings.NEW_RELIC_NAME;

        keen.recordEvent(event.type, event.payload);
    }

    public static query(analysis: string, parameters: any): Promise<any> {
        return keen.query(analysis, parameters);
    }
}
