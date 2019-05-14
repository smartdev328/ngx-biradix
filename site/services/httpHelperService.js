angular.module("biradix.global").factory("$httpHelperService", ["$cookies", "toastr", function($cookies, toastr) {
    var fac = {};


    fac.authHeader = function() {
        return {'Authorization': 'Bearer ' + $cookies.get('token')};
    };

    fac.handleError = function(err) {
        if (err.status === 400) {
            toastr.error(err.data);
        } else if (err.status === 401) {
            $rootScope.logoff();
        } else {
            rg4js('send', new Error("User saw API unavailable error alert/message/page"));
            toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
        }
    };

    return fac;
}]);
