'use strict';
define(['app'], function (app) {
    app.factory('$authService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.refreshToken = function (token, callback) {
            return $http.get('/api/1.0/users/refreshToken', {
                headers: {'Authorization': 'Bearer ' + token }}).success(function (response) {
                if (response.token != null) {
                    $cookies.put('token',response.token)
                    callback(response.user,200);
                }
                callback(null,200);

            }).error(function (response,status) {
                callback(null,status);
            });
        }

        fac.login = function (email, password) {
            return $http.post('/api/1.0/users/login', { email: email, password: password }).success(function (response) {
                if (response.token != null) {
                    $cookies.put('token',response.token)
                }
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.me = function (token, callback) {
            return $http.get('/api/1.0/users/me', {
                headers: {'Authorization': 'Bearer ' + token }}).success(function (response) {
                callback(response,200);
            }).error(function (response,status) {
                callback(null,status);
            });
        }

        fac.updateMe = function (account) {
            return $http.put('/api/1.0/users/me', account, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.updateSettings = function (settings) {
            return $http.put('/api/1.0/users/me/settings', settings, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        return fac;
    }]);
});