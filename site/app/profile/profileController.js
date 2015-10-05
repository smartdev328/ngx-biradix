'use strict';
define([
    'app',
    '../../components/propertyProfile/about',
    '../../components/propertyProfile/profile',
    '../../components/propertyProfile/fees',
    '../../components/propertyProfile/amenities',
    '../../components/propertyProfile/floorplans',
    '../../components/propertyProfile/tableView',
    '../../services/progressService',
    '../../components/toggle/module',
    '../../components/daterangepicker/module',
    '../../components/timeseries/module',
    '../../services/cookieSettingsService',
    '../../services/auditService'
], function (app) {

    app.controller('profileController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$stateParams', '$window','$cookies', 'ngProgress', '$progressService', '$cookieSettingsService', '$auditService', function ($scope,$rootScope,$location,$propertyService,$authService, $stateParams, $window, $cookies, ngProgress, $progressService, $cookieSettingsService, $auditService) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }
        $rootScope.nav = ''
        $rootScope.sideMenu = false;

        $scope.setRenderable = function() {
            window.setTimeout(function() {
                window.renderable = true;
            },600)
        }

        $scope.daterange=$cookieSettingsService.getDaterange();

        $scope.$watch('daterange', function(d) {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveDaterange($scope.daterange)
            $scope.refreshGraphs();
        }, true);

        $scope.graphs = $cookieSettingsService.getGraphs();

        $scope.$watch('graphs', function() {
            if (!$scope.localLoading) return;
            $cookieSettingsService.saveGraphs($scope.graphs)
            $scope.refreshGraphs();
        }, true);

        $scope.propertyId = $stateParams.id;

        $scope.refreshGraphs = function() {
            $scope.loadProperty($scope.propertyId, true);
        }


        $scope.loadProperty = function(defaultPropertyId, trendsOnly) {

            if (defaultPropertyId) {

                if (!trendsOnly) {
                    $scope.localLoading = false;
                } else {
                    $scope.trendsLoading = false;
                }

                $propertyService.profile(defaultPropertyId
                    , {
                        daterange: $scope.daterange.selectedRange,
                        start: $scope.daterange.selectedStartDate,
                        end: $scope.daterange.selectedEndDate
                    }
                    ,{occupancy: true, ner: true, traffic: true, leases: true, bedrooms: true, graphs: $scope.graphs}
                ).then(function (response) {

                        var resp = $propertyService.parseProfile(response.data.profile,$scope.graphs);

                        if (!resp) {
                            $location.path('/dashboard')
                            return;
                        }

                        if (!trendsOnly) {
                            $scope.lookups = resp.lookups;
                            $scope.property = resp.property;
                            $scope.canManage = resp.canManage;
                            $scope.comp = resp.comp;
                            $window.document.title = $scope.property.name;

                            $auditService.create({type: 'property_profile', property: {id: resp.property._id, name: resp.property.name, orgid: resp.property.orgid}, description: resp.property.name});
                        }

                        $scope.points = resp.points;
                        $scope.surveyData = resp.surveyData;
                        $scope.nerData = resp.nerData
                        $scope.occData = resp.occData;
                        $scope.otherData = resp.otherData;
                        $scope.nerKeys = resp.nerKeys;
                        $scope.otherTable = resp.otherTable

                        $scope.localLoading = true;
                        $scope.trendsLoading = true;

                        $scope.setRenderable();


                });
            }
        };

        $scope.width = function() {

            return $(window).width()
        }

        $scope.loadProperty($scope.propertyId)

        $scope.$on('data.reload', function(event, args) {
            $scope.loadProperty($scope.propertyId)
        });

        $scope.checkProgress = function() {

            $progressService.isComplete($scope.progressId, function(isComplete) {

                if (isComplete) {
                    ngProgress.complete();
                    $('#export').prop('disabled', false);
                }
                else {
                    $window.setTimeout($scope.checkProgress, 500);
                }
            })

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

            $window.setTimeout($scope.checkProgress, 500);

            location.href = url;

            $auditService.create({type: 'excel_profile', property: {id: $scope.property._id, name: $scope.property.name, orgid: $scope.property.orgid}, description: $scope.property.name + ' - ' + $scope.daterange.selectedRange});

        }

        $scope.pdf = function(full) {

            ngProgress.start();

            $('#export').prop('disabled', true);

            $scope.progressId = _.random(1000000, 9999999);

            var url = $scope.getPdfUrl(full, true);

            $window.setTimeout($scope.checkProgress, 500);

            location.href = url;

        }

        $scope.getPdfUrl = function(full, showFile) {
            var url = '/api/1.0/properties/' + $scope.property._id + '/pdf?'
            url += "token=" + $cookies.get('token')
            url += "&Graphs=" + $scope.graphs
            url += "&selectedStartDate=" + $scope.daterange.selectedStartDate.format()
            url += "&selectedEndDate=" + $scope.daterange.selectedEndDate.format()
            url += "&selectedRange=" + $scope.daterange.selectedRange
            url += "&timezone=" + moment().utcOffset()
            url += "&progressId=" + $scope.progressId
            url += "&full=" + full
            url += "&showFile=" + showFile

            return url;
        }

        $scope.print = function(full) {
            var url = $scope.getPdfUrl(full, "");
            window.open(url);
        }

    }]);
});