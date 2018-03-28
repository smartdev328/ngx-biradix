import {expect, should} from "chai";
import {redisClient} from "../../../library/sharedFakes/redisClient";
import {ShortenerService } from "./ShortenerService";

const shortenerService = new ShortenerService(redisClient());

describe("ShortenService (Server)", () => {
    it("should shorten 'test' as md5 key", (done) => {
        shortenerService.shorten("test", 30).then((key: string) => {
            expect(key).to.equal("098f6bcd4621d373cade4e832627b4f6");
            done();
        });
    });

    it("should retrieve 'test' from md5 key", (done) => {
        shortenerService.retrieve("098f6bcd4621d373cade4e832627b4f6").then((body: string) => {
            expect(body).to.equal("test");
            done();
        });
    });
});
