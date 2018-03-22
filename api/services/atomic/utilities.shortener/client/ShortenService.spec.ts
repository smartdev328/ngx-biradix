import {expect, should} from "chai";
import {rabbit} from "../../../library/sharedFakes/rabbit";
import {redisClient} from "../../../library/sharedFakes/redisClient";
import {ShortenerService } from "./ShortenerService";

const sortenerService = new ShortenerService();

describe("ShortenerService (Client)", () => {
    it("should Resolve 'Success' in init()", (done) => {
        sortenerService.init(rabbit(), redisClient()).then((message: string) => {
            expect(message).to.equal("Success");
            done();
        });
    });
});
