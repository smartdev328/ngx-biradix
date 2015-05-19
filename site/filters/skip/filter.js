'use strict';

define(['app'], function (app) {

    app.filter('skip', function () {
        return function (input, skipCount) {
            if (!input) return input;
            return input.slice(skipCount);
        };

    })

})