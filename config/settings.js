module.exports = {
    RAYGUN_APIKEY: process.env.RAYGUN_APIKEY || 'XJ1lA7KU3Esr4RvtAiaObQ==',
    MONGODB_URI: process.env.MONGOLAB_URI || 'mongodb://heroku_app36507393:dfahaf7jb2gkpmcgh538pmj8d8@ds031822.mongolab.com:31822/heroku_app36507393',
    SENDGRID_USERNAME : process.env.SENDGRID_USERNAME || 'app36507393@heroku.com',
    SENDGRID_PASSWORD : process.env.SENDGRID_PASSWORD || 'vnlgjsnu0908',
    MODE : process.env.mode || 'development',
    PORT : process.env.PORT || 2000,
    SECRET : process.env.secret || 'test',
    API_PATH : process.env.apipath || '/api/1.0/',
    NEW_RELIC_LICENSE_KEY : process.env.apipath || '5b83e39bf5ec8e9820f059846c157bb5b13b91e5'

}