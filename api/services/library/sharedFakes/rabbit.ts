let savedConsumer;

export function rabbit() {
    const fac: any = {};

    fac.default = () => {
        return {
            publish: (message, {key, reply}) => {
                if (!savedConsumer) {
                    reply({error: {message, key}});
                } else {
                    savedConsumer(message, reply);
                }
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
