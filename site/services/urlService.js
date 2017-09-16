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

        return fac;
    }]);
