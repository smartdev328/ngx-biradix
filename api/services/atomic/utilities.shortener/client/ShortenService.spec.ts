import {expect, should} from "chai";
import {rabbit} from "../../../library/sharedFakes/rabbit";
import {redisClient} from "../../../library/sharedFakes/redisClient";
import {RETRIEVE_FUNCTION, SHORTEN_FUNCTION} from "../contracts/Settings";
import {ShortenerService } from "./ShortenerService";

const sortenerService = new ShortenerService();

describe("ShortenerService (Client)", () => {
    it("should Resolve 'Success' in init()", (done) => {
        sortenerService.init(rabbit(), redisClient()).then((message: string) => {
            expect(message).to.equal("Success");
            done();
        });
    });

    it("should Populate Shorten Message correctly", (done) => {
        sortenerService.shorten("test", 30).catch((error) => {
            expect(error.message.payload.body).to.equal("test");
            expect(error.message.payload.expiresInMinutes).to.equal(30);
            expect(error.message.functionName).to.equal(SHORTEN_FUNCTION);
            done();
        });
    });

    it("should Populate Retrieve Message correctly", (done) => {
        sortenerService.retrieve("abc").catch((error) => {
            expect(error.message.payload).to.equal("abc");
            expect(error.message.functionName).to.equal(RETRIEVE_FUNCTION);
            done();
        });
    });
});
