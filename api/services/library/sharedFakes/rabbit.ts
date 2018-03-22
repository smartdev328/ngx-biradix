let savedConsumer;

export function rabbit() {
    const fac: any = {};

    fac.default = () => {
        return {
            publish: (message, {key, reply}) => {
                savedConsumer(message, reply);
            },
            queue: (argsQueue) => {
                return {
                    consume: (consumer) => {
                        savedConsumer = consumer;
                        return;
                    },
                    on: (argsOn, cb) => {
                        return cb();
                    },
                };
            },
        };
    };

    return fac;
}
