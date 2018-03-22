export function redisClient() {
    const fac: any = {};
    const storage = {};

    fac.set = (key, value) => {
        storage[key] = value;
        return;
    };

    fac.expire = (key: string, seconds: number) => {
        return;
    };

    fac.get = (key, callback) => {
        callback(null, storage[key]);
    };

    return fac;
}
