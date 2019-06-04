'use strict';
angular.module('biradix.global').factory('$organizationsService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};
        //emulation
        fac.organizations = [];
        //end emulation

        fac.public = function (subdomain) {
            return $http.get(gAPI + "/org/" + subdomain + '?bust=' + (new Date()).getTime(), {
                }).success(function(response) {
                return response;
            }).error(function(response) {
                return response;
            });
        }

        fac.search = function () {
            return $http.post(gAPI + '/api/1.0/organizations'+ '?bust=' + (new Date()).getTime(), {}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                //emulation
                response.organizations = response.organizations.map(function (item, index) {
                    return {
                        ...item,
                        ...fac.organizations.find(function (localItem, localIndex) {
                            return localItem._id == item._id;
                        })
                    }
                });
                //end emulation
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.updateDefaultSettings = function (org) {
            return $http.put(gAPI + '/api/1.0/organizations/' + org._id + '/defaultSettings'+ '?bust=' + (new Date()).getTime(), org.settings, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        //emulation
        fac.updateSSOSettings = function (org) {
            return new Promise(function (resolve, reject) {
                var i = fac.organizations.findIndex(function (item, index) {
                    return item._id == org._id;
                });
                if (i != -1) {
                    fac.organizations[i] = {
                        ...fac.organizations[i],
                        ...org,
                    };
                } else {
                    fac.organizations.push(org);
                }
                resolve(fac.organizations);
            });
        }
        //end emulation

        return fac;
    }]);
