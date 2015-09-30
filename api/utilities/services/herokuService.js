'use strict';
var settings = require('../../../config/settings')
var Heroku = require('heroku-client'),
    heroku = new Heroku({ token: settings.HEROKU_API_KEY });

module.exports = {
    restartAllDynos: function () {
        heroku.delete('/apps/' + settings.HEROKU_APP+ "/dynos", function (err, app) {

        });
    }
}
