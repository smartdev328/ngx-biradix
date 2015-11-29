'use strict';
define([
    'app',
    '../../components/propertyProfile/profile',
    '../../components/propertyProfile/comps',
    '../../components/googleMap/module',
    '../../components/toggle/module',
    '../../components/timeseries/module',
    '../../services/cookieSettingsService',
    '../../services/exportService',
    '../../services/progressService',
    '../../services/auditService',
], function (app) {

    app.controller('dashboardController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$cookieSettingsService','$cookies','$exportService','$progressService','ngProgress','$auditService','toastr', function ($scope,$rootScope,$location,$propertyService,$authService,$cookieSettingsService,$cookies,$exportService,$progressService,ngProgress,$auditService,toastr) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }
        $rootScope.nav = 'Dashboard'
        $rootScope.sideMenu = false;
        $rootScope.sideNav = "Dashboard";
        $scope.filters = {searchDashboard : ""};
        //window.renderable = true;

        $scope.localLoading = false;

        $scope.daterange=$cookieSettingsService.getDaterange();

        $scope.summary = $cookieSettingsService.getSummary();

        $scope.graphs = $cookieSettingsService.getGraphs();

        $scope.selectedBedroom = -1;
        $scope.bedrooms = [{value: -1, text: 'All'}]


        $scope.orderByComp = "number";

        if ($cookies.get("cmp.o")) {
            $scope.orderByComp = $cookies.get("cmp.o");
        }

        /*************************************/
        $scope.defaultShow = function() {
            $scope.show = {
                units: true,
                unitPercent: false,
                occupancy: true,
                sqft: true,
                rent: true,
                concessions: true,
                ner: true,
                nersqft: true,
                mersqft: false
            }


            var w = $(window).width();

            if (w < 1175) {
                $scope.show.rent = false;
                $scope.show.concessions = false;
            }

            if (w < 1000) {
                $scope.show.ner = false;
            }

            if (w < 500) {
                $scope.show.sqft = false;
                $scope.show.occupancy = false;
                $scope.show.units = false;
            }
        }

        $scope.defaultShow();

        if ($cookies.get("cmp.s")) {
            $scope.show = JSON.parse($cookies.get("cmp.s"));
        }

        $scope.reset = function() {
            $scope.defaultShow();
            $cookies.put('cmp.s');
            $scope.orderByComp = "number";
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('cmp.o', $scope.orderByComp, {expires : expireDate})
        }

        $scope.saveShow = function() {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('cmp.s', JSON.stringify($scope.show), {expires : expireDate})
        }
        /**********************************************/
        $scope.defaultShowProfile = function() {
            $scope.showProfile = {
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
                traf: true,
                lease: true
            }

        }

        $scope.defaultShowProfile();

        if ($cookies.get("pr.s")) {
            $scope.showProfile = JSON.parse($cookies.get("pr.s"));
        }

        $scope.resetProfile = function() {
            $scope.defaultShowProfile();
            $cookies.put('pr.s');
        }

        $scope.saveShowProfile = function() {
            var expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + 365);
            $cookies.put('pr.s', JSON.stringify($scope.showProfile), {expires : expireDate})
        }
        /***************************/

        $scope.$watch('daterange', function(d) {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveDaterange($scope.daterange)
            $scope.refreshGraphs();
        }, true);

        $scope.$watch('summary', function() {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveSummary($scope.summary)
            $scope.refreshGraphs();
        }, true);

        $scope.refreshGraphs = function() {
            $scope.selectedBedroom = $scope.bedroom.value;
            $scope.loadProperty($scope.selectedProperty._id, true);
        }

        //make sure me is loaded befor you search initially
        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                me();
                $propertyService.search({
                    limit: 1000,
                    permission: 'PropertyManage',
                    active: true
                }).then(function (response) {
                    $scope.myProperties = response.data.properties;


                    var id = $rootScope.me.settings.defaultPropertyId;


                    if (!$scope.myProperties || $scope.myProperties.length == 0) {
                        id = null;
                    }
                    else if (!id) {
                        $scope.selectedProperty = $scope.myProperties[0];
                    } else {
                        $scope.selectedProperty = _.find($scope.myProperties, function (x) {
                            return x._id.toString() == id
                        })
                    }

                    if ($scope.selectedProperty) {
                        $scope.loadProperty($scope.selectedProperty._id)
                    } else {
                        $scope.localLoading = true;
                    }

                }, function (error) {
                    if (error.status == 401) {
                        $rootScope.logoff();
                        return;
                    }

                    toastr.error('Unable to access the system at this time. Please contact an administrator');
                    $scope.localLoading = true;
                })
            }
        });

        $scope.viewProfile = function() {
            $location.path("/profile/" + $scope.selectedProperty._id);
        }

        $scope.changeProperty = function() {
            $scope.loadProperty($scope.selectedProperty._id);
            $rootScope.me.settings.defaultPropertyId = $scope.selectedProperty._id;
            $authService.updateSettings($rootScope.me.settings).then(function() {
                $rootScope.refreshToken();
            });

        }

        $scope.setProperty = function(property) {
            $scope.selectedProperty = property;

            $scope.changeProperty();
        }

        $scope.$on('data.reload', function(event, args) {
            $scope.changeProperty();
        });

        $scope.loadProperty = function(defaultPropertyId, trendsOnly) {
            if (defaultPropertyId) {
                if (!trendsOnly) {
                    $scope.localLoading = false;
                } else {
                    $scope.trendsLoading = false;
                }
                $propertyService.dashboard(
                    defaultPropertyId
                    , $scope.summary
                    , $scope.selectedBedroom
                    , {
                        daterange: $scope.daterange.selectedRange,
                        start: $scope.daterange.selectedStartDate,
                        end: $scope.daterange.selectedEndDate
                        }
                    ,{ner: true, occupancy: true, graphs: true}
                ).then(function (response) {

                    var resp = $propertyService.parseDashboard(response.data,$scope.summary);

                    if (!trendsOnly) {
                        $scope.property = resp.property;
                        $scope.comps = resp.comps;

                        $scope.mapOptions = resp.mapOptions;
                        $scope.bedrooms = resp.bedrooms;
                        $scope.bedroom = resp.bedroom;

                        window.document.title = resp.property.name + " - Dashboard | BI:Radix";
                    }

                    $scope.points = resp.points;
                    $scope.nerData = resp.nerData;
                    $scope.occData = resp.occData;

                    $scope.localLoading = true;
                    $scope.trendsLoading = true;
                }, function(error) {
                    if (error.status == 401) {
                        $rootScope.logoff();
                        return;
                    }

                    toastr.error('Unable to access the system at this time. Please contact an administrator');

                    $scope.localLoading = true;
                });
            }
        };

        $scope.checkProgress = function() {

            $progressService.isComplete($scope.progressId, function(isComplete) {

                if (isComplete) {
                    ngProgress.complete();
                    $('#export').prop('disabled', false);
                }
                else {
                    window.setTimeout($scope.checkProgress, 500);
                }
            })

        }

        $scope.pdf = function(full) {

            ngProgress.start();

            $('#export').prop('disabled', true);

            $scope.progressId = _.random(1000000, 9999999);

            $exportService.print($scope.property._id, full,true, $scope.daterange, $scope.progressId, $scope.graphs);

            window.setTimeout($scope.checkProgress, 500);

        }

        $scope.print = function(full) {
            $exportService.print($scope.property._id, full,"", $scope.daterange, "", $scope.graphs);
        }

        $scope.excel = function() {

            ngProgress.start();

            $('#export').prop('disabled', true);

            $scope.progressId = _.random(1000000, 9999999);

            var url = '/api/1.0/properties/' + $scope.property._id + '/excel?'
            url += "token=" + $cookies.get('token')
            url += "&timezone=" + moment().utcOffset()
            url += "&selectedStartDate=" + $scope.daterange.selectedStartDate.format()
            url += "&selectedEndDate=" + $scope.daterange.selectedEndDate.format()
            url += "&selectedRange=" + $scope.daterange.selectedRange
            url += "&progressId=" + $scope.progressId

            window.setTimeout($scope.checkProgress, 500);

            location.href = url;

            $auditService.create({type: 'excel_profile', property: {id: $scope.property._id, name: $scope.property.name, orgid: $scope.property.orgid}, description: $scope.property.name + ' - ' + $scope.daterange.selectedRange});

        }

    }]);
});