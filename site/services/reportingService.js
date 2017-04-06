
'use strict';
define([
    'app',
    '../../services/cookieSettingsService'
], function (app) {
    app.factory('$reportingService', ['$http','$cookies','$cookieSettingsService', function ($http,$cookies,$cookieSettingsService) {
        var fac = {};

        fac.reports = function(compids, subjectid, reports) {
            return $http.post('/api/1.0/reporting/' + subjectid + '?bust=' + (new Date()).getTime(), {
                compids: compids,
                reports: reports,
            }, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.reportsGroup = function(propertyids, reports) {
            return $http.post('/api/1.0/reporting/group'+ '?bust=' + (new Date()).getTime(), {
                propertyids: propertyids,
                reports: reports,
            }, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.getDashboardSettings = function(me) {

        }

        fac.getDefaultInfoRows = function(me) {
            return {
                address: true,
                website: false,
                phone: true,
                email: false,
                name: false,
                const: true,
                built: true,
                ren: false,
                owner: true,
                mgmt: true,
                units: true,
                occ: true,
                leased: me ? me.settings.showLeases : true,
                renewal: me ? me.settings.showRenewal : true,
                traf: true,
                lease: true
            }
        }
        
        fac.getDefaultProfileFloorplanColumns = function(width) {
            var columns = {
                description: true,
                units: true,
                unitPercent: true,
                sqft: true,
                rent: true,
                concessions: true,
                ner: true,
                nersqft: true,
                mersqft: false
            }

            if (width < 1024) {
                columns.rent = false;
                columns.concessions = false;
                columns.unitPercent = false;
            }

            if (width < 500) {
                columns.ner = false;
                columns.description = false;
            }    
            
            return columns;
        }

        fac.getDefaultDashboardCompColumns = function(me,width) {
            var columns = {
                units: true,
                unitPercent: false,
                occupancy: true,
                leased: me.settings.showLeases,
                renewal: me.settings.showRenewal,
                sqft: true,
                rent: true,
                concessions: true,
                ner: true,
                nersqft: true,
                mersqft: false,
                weekly:false
            }

            if (width < 1175) {
                columns.rent = false;
                columns.concessions = false;
            }

            if (width < 1000) {
                columns.ner = false;
            }

            if (width < 500) {
                columns.sqft = false;
                columns.occupancy = false;
                columns.leased = false
                columns.renewal = false
                columns.units = false;
            }

            return columns;
        }

        return fac;
    }]);
});
