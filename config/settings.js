module.exports = {
    RAYGUN_APIKEY: process.env.RAYGUN_APIKEY || 'XJ1lA7KU3Esr4RvtAiaObQ==',
    MONGODB_URI: process.env.MONGOHQ_URL ||process.env.MONGOLAB_URI || 'mongodb://localhost:27017/Biradix',
    SENDGRID_USERNAME : process.env.SENDGRID_USERNAME || 'app36507393@heroku.com',
    SENDGRID_PASSWORD : process.env.SENDGRID_PASSWORD || 'vnlgjsnu0908',
    MODE : process.env.mode || 'development',
    PORT : process.env.PORT || 2000,
    SECRET : process.env.secret || 'test',
    API_PATH : process.env.apipath || '/api/1.0/',
    NEW_RELIC_LICENSE_KEY : process.env.NEW_RELIC_LICENSE_ || '5b83e39bf5ec8e9820f059846c157bb5b13b91e5',
    NEW_RELIC_NAME : process.env.NEW_RELIC_NAME || 'Localhost',
    REDISCLOUD_URL : process.env.REDISCLOUD_URL || 'redis://rediscloud:jcMohesUWVNr3SeX@pub-redis-10859.us-east-1-4.3.ec2.garantiadata.com:10859',
    EXCEL_URL : process.env.EXCEL_URL || 'http://localhost:12008/excel',
    CLOUDAMQP_URL : process.env.CLOUDAMQP_URL || 'amqp://bbanyfha:bN4-8vTtTTY6yzGqE7A-_9QY6XYv0Nxi@baboon.rmq.cloudamqp.com/bbanyfha',
    DASHBOARD_QUEUE : "jobs.property.dashboard",
    PROFILE_QUEUE : "jobs.property.profile",
    PDF_PROFILE_QUEUE : "jobs.property.profile.pdf",
    PDF_REPORTING_QUEUE : "jobs.reporting.pdf",
    RUN_PHANTOM : process.env.RUN_PHANTOM || "web",
    RUN_DASHBOARD : process.env.RUN_DASHBOARD || "web",
    HEROKU_API_KEY : process.env.HEROKU_API_KEY,
    HEROKU_APP : process.env.HEROKU_APP || "birdaixplatform-dev"

}