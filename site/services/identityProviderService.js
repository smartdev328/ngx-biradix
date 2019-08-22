'use strict';
angular.module("biradix.global").factory('$identityProviderService', ['$http', '$cookies', function ($http,$cookies) {
  var fac = {};

  fac.getCallbackUrl = function(o) {
    return $http.post(gAPI + "/api/1.0/identityProvider/callbackUrl?bust=" + (new Date()).getTime(), {o: o}, {
      headers: {"Authorization": "Bearer " + $cookies.get("token")}}).success(function(response) {
      return response;
    }).error(function(response) {
      return response;
    });
  };

  return fac;
}]);
