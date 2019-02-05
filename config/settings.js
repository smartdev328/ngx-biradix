module.exports = {
    RAYGUN_APIKEY: process.env.RAYGUN_APIKEY || "pVcxW+v/CU01JzU+42/WAg==",
    MODE: process.env.mode || "dev",
    PORT: process.env.PORT || 2000,
    SECRET: process.env.secret || "test",
    NEW_RELIC_LICENSE_KEY: process.env.NEW_RELIC_LICENSE_KEY || "75d3c144332d3045905a17e15206ab4d0dfc243a",
    NEW_RELIC_NAME: process.env.NEW_RELIC_NAME || "LOCAL",
    HEROKU_API_KEY: process.env.HEROKU_API_KEY,
    HEROKU_APP: process.env.HEROKU_APP || "birdaixplatform-dev",
    PROJECT_DIR: __dirname,
    MAINTENANCE_MODE: (process.env.MAINTENANCE_MODE || "0") === "1",
    API_URL: process.env.API_URL || "https://api-qa.biradix.com",
    //API_URL: process.env.API_URL || "https://biradixapi-integration.herokuapp.com",
};
