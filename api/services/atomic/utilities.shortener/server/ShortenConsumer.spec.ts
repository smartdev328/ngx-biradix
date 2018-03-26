import {expect, should} from "chai";
import {IRPCMessage} from "../../../library/sharedContracts/IMessage";
import {rabbit} from "../../../library/sharedFakes/rabbit";
import {redisClient} from "../../../library/sharedFakes/redisClient";
import {QUEUE_NAME, RETRIEVE_FUNCTION, SHORTEN_FUNCTION} from "../contracts/Settings";
import {ShortenerConsumer } from "./ShortenerConsumer";

const shortenerConsumer = new ShortenerConsumer();

describe("ShortenerConsumer", () => {
    it("should Resolve 'Success' in init()", (done) => {
        shortenerConsumer.init(rabbit(), redisClient()).then((message: string) => {
            expect(message).to.equal("Success");
            done();
        });
    });

    it("should shorten 'test' as md5 key through Publish", (done) => {
        const message: IRPCMessage = {
            functionName: SHORTEN_FUNCTION,
            payload: {
                body: "test",
                expiresInMinutes: 30,
            },
        };
        rabbit().default().publish(message, {
            key: QUEUE_NAME,
            reply(data: any) {
                expect(data.key).to.equal("098f6bcd4621d373cade4e832627b4f6");
                done();
            },
        });
    });

    it("should retrieve 'test' from md5 key through Publish", (done) => {
        const message: IRPCMessage = {
            functionName: RETRIEVE_FUNCTION,
            payload: "098f6bcd4621d373cade4e832627b4f6",
        };
        rabbit().default().publish(message, {
            key: QUEUE_NAME,
            reply(data: any) {
                expect(data.body).to.equal("test");
                done();
            },
        });
    });
});
