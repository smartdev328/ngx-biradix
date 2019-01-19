angular.module('biradix.global').factory('$propertyUsersService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.getPropertyAssignedUsers = function (propertyid) {
            return $http.get(gAPI + '/api/1.0/propertyusers/users/' + propertyid+ '?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.getUserAssignedProperties = function (userid) {
            return $http.get(gAPI + '/api/1.0/propertyusers/properties/' + userid+ '?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.setPropertiesForUser = function (userid, properties,rolesChanged) {
            return $http.put(gAPI + '/api/1.0/propertyusers/properties/' + userid+ '?bust=' + (new Date()).getTime(), {properties: properties, rolesChanged: rolesChanged}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.setUsersForProperty = function (propertyid, users) {
            return $http.put(gAPI + '/api/1.0/propertyusers/users/' + propertyid+ '?bust=' + (new Date()).getTime(), users, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.link = function (propertyid, userid) {
            return $http.get(gAPI + '/api/1.0/propertyusers/link/' + propertyid+ '/'+ userid+'?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.unlink = function (propertyid, userid) {
            return $http.get(gAPI + '/api/1.0/propertyusers/unlink/' + propertyid+ '/'+ userid+'?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }
        return fac;
    }]);
