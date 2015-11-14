'use strict';
define([
    'app',
    '../../components/propertyProfile/profile',
    '../../components/propertyProfile/comps',
    '../../components/propertyProfile/about',
    '../../components/propertyProfile/fees',
    '../../components/propertyProfile/amenities',
    '../../components/propertyProfile/floorplans',
    '../../components/propertyProfile/tableView',
    '../../components/googleMap/module',
    '../../components/timeseries/module',
    '../../services/cookieSettingsService'
], function (app) {

    app.controller('fullController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$cookieSettingsService', '$stateParams','$cookies', function ($scope,$rootScope,$location,$propertyService,$authService,$cookieSettingsService,$stateParams,$cookies) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }
        $rootScope.nav = 'Dashboard'
        $rootScope.sideMenu = false;
        //window.renderable = true;

        $scope.localLoading = false;

        $scope.daterange=$cookieSettingsService.getDaterange();

        $scope.summary = $cookieSettingsService.getSummary();

        $scope.graphs = $cookieSettingsService.getGraphs();

        $scope.orderByFp = "sqft";

        if ($cookies.get("fp.o")) {
            $scope.orderByFp = $cookies.get("fp.o");
        }

        $scope.show = {description:true,units:true,unitPercent:true,sqft:true,rent:true,concessions:true,ner:true,nersqft:true,mersqft: false}
        if ($cookies.get("fp.s")) {
            $scope.show = JSON.parse($cookies.get("fp.s"));
        }

        $scope.orderByComp = "number";

        if ($cookies.get("cmp.o")) {
            $scope.orderByComp = $cookies.get("cmp.o");
        }

        $scope.showComp = {description:true,units:true,unitPercent:false,occupancy:true,sqft:true,rent:true,concessions:true,ner:true,nersqft:true,mersqft: false}
        if ($cookies.get("cmp.s")) {
            $scope.showComp = JSON.parse($cookies.get("cmp.s"));
        }

        $scope.loadProperty = function(defaultPropertyId) {
            if (defaultPropertyId) {
                $scope.localLoading = false;

                $propertyService.full(
                    defaultPropertyId
                    , $scope.summary
                    , $scope.selectedBedroom
                    , {
                        daterange: $scope.daterange.selectedRange,
                        start: $scope.daterange.selectedStartDate,
                        end: $scope.daterange.selectedEndDate
                        }
                    ,{graphs: $scope.graphs }
                ).then(function (response) {
                    var resp = $propertyService.parseDashboard(response.data.dashboard,$scope.summary);

                        window.document.title = resp.property.name + " - Profile + Comps | BI:Radix";

                    $scope.property = resp.property;
                    $scope.comps = resp.comps;

                    $scope.mapOptions = resp.mapOptions;
                    $scope.bedrooms = resp.bedrooms;
                    $scope.bedroom = resp.bedroom;;

                    $scope.points = resp.points;
                    $scope.nerData = resp.nerData;
                    $scope.occData = resp.occData;

                    $scope.localLoading = true;
                    $scope.trendsLoading = true;

                        $scope.profiles = [];

                    response.data.profiles.forEach(function(p) {
                        var resp = $propertyService.parseProfile(p,$scope.graphs);

                        $scope.profiles.push({
                            lookups : resp.lookups,
                            property : resp.property,
                            comp : resp.comp,
                            points : resp.points,
                            surveyData : resp.surveyData,
                            nerData : resp.nerData,
                            occData : resp.occData,
                            otherData : resp.otherData,
                            nerKeys : resp.nerKeys,
                            otherTable : resp.otherTable
                        });
                    })

                    $scope.profiles = _.sortBy($scope.profiles, function (n) {
                        if (n.property._id.toString() == $stateParams.id.toString()) {
                            return "-1";
                        }
                        return n.property.name;
                    })

                    $scope.setRenderable();
                });
            }
        };

        $scope.loadProperty($stateParams.id);

        $scope.setRenderable = function() {
            if (!phantom) {
                //window.setTimeout(function () {
                //    window.print();
                //}, 2000)
            }
            else {
                window.setTimeout(function () {
                    window.renderable = true;
                }, 2000)
            }
        }

    }]);
});