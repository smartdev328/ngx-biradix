angular.module('biradix.global').factory('$reportingService', ['$http','$cookies','$cookieSettingsService', function ($http,$cookies,$cookieSettingsService) {
        var fac = {};

        fac.reports = function(compids, subjectid, reports, options) {
            return $http.post('/api/1.0/reporting/' + subjectid + '?bust=' + (new Date()).getTime(), {
                compids: compids,
                reports: reports,
                options: options,
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

        fac.getDashboardSettings = function(me, width) {
            var settings = {}
            settings.daterange=$cookieSettingsService.getDaterange();
            settings.summary = $cookieSettingsService.getSummary();

            settings.totals = $cookieSettingsService.getTotals();

            settings.nerScale = $cookieSettingsService.getNerScale();

            settings.selectedBedroom = $cookieSettingsService.getBedrooms();

            settings.orderByComp = "number";

            if ($cookies.get("cmp.o")) {
                settings.orderByComp = $cookies.get("cmp.o");
            }

            settings.show = fac.getDefaultDashboardCompColumns(me,width);

            if ($cookies.get("cmp.s")) {
                settings.show = JSON.parse($cookies.get("cmp.s"));
            }

            return settings;
        }

        fac.getProfileSettings = function(width) {
            var settings = {}
            settings.orderByFp = "sqft";

            if ($cookies.get("fp.o")) {
                settings.orderByFp = $cookies.get("fp.o");
            }

            settings.show = fac.getDefaultProfileFloorplanColumns(width);

            if ($cookies.get("fp.s")) {
                settings.show = JSON.parse($cookies.get("fp.s"));
            }

            settings.daterange=$cookieSettingsService.getDaterange();
            settings.graphs=$cookieSettingsService.getGraphs();
            settings.nerScale= $cookieSettingsService.getNerScale();

            return settings;

        }

        fac.getInfoRows = function(me) {
            var settings = fac.getDefaultInfoRows(me);
            if ($cookies.get("pr.s")) {
                settings = JSON.parse($cookies.get("pr.s"));
            }
            if (typeof settings.picture == 'undefined') {
                settings.picture = true;
            }

            return settings;
        }

        fac.getDefaultInfoRows = function(me) {
            return {
                picture: true,
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
                atr: me ? me.settings.showATR : false,
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
                atr: me.settings.showATR,
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
