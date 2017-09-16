angular.module('biradix.global').factory('$urlService', ['$http', function ($http,$cookies) {
        var fac = {};

        fac.shorten = function (url) {

            var strReturn = "";

            jQuery.ajax({
                type: "POST",
                data: {url:url},
                url: '/url'+ '?bust=' + (new Date()).getTime(),
                success: function(html) {
                    strReturn = html.key;
                },
                async:false
            });

            return strReturn;
        }

    fac.shortenAsync = function (url, callback) {
        jQuery.ajax({
            type: "POST",
            data: {url:url},
            url: '/url'+ '?bust=' + (new Date()).getTime(),
            success: function(html) {
                callback(html.key);
            },
            async:true
        });
    }
        return fac;
    }]);
