import * as Keen from "keen-js";
import * as settings from "../../../config/settings";
import {IEvent} from "../interfaces/IEvents";

const keen = new Keen({
    projectId: "5ab6b675c9e77c00016930ad",
    writeKey: "CECDC1B35BEDB07F0AEA1C9CCF4D2425D057BAB91C01C479D5382AE9152D991836AE2DA9CB922A095D01C6611DFE3DF1002E15655155C38ACB985D12AD51BB867848F752697BACC3C770FF8001D427F7A14D7E0FCA1DE71A5B567AE7F819AB15",
});

export class KeenService {
    public static recordEvent(event: IEvent) {
        event.payload.env = settings.NEW_RELIC_NAME;
        keen.recordEvent(event.type, event.payload);
    }
}
