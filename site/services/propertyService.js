'use strict';
define(['app'], function (app) {
    app.factory('$propertyService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};


        fac.search = function (criteria) {
            return $http.post('/api/1.0/properties', criteria, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.setActive = function (active, userId) {
            return $http.put('/api/1.0/properties/' + userId + '/active', { active: active}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.lookups = function () {
            return $http.get('/api/1.0/properties/lookups', {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.unlinkComp = function (propertyid, compid) {
            return $http.delete('/api/1.0/properties/' + propertyid + '/comps/' + compid, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.saveCompLink = function (propertyid, compid, floorplans) {
            return $http.post('/api/1.0/properties/' + propertyid + '/comps/' + compid, floorplans, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.linkComp = function (propertyid, compid) {
            return $http.put('/api/1.0/properties/' + propertyid + '/comps/' + compid, {}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.floorplanName = function(fp) {
            var name = fp.bedrooms + "x" + fp.bathrooms;

            if (fp.description && fp.description != "") {
                name += " " + fp.description;
            } else {
                name += " - ";
            }

            name += " " + fp.sqft + " Sqft";
            name += ", " + fp.units + " Units";

            return name
        }

        return fac;
    }]);
});