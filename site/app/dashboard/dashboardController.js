'use strict';
define([
    'app',
    '../../components/propertyProfile/profile',
    '../../components/propertyProfile/comps',
    '../../components/googleMap/module',
    '../../components/toggle/module',
    '../../components/daterangepicker/module',
    '../../components/timeseries/module',
    '../../services/cookieSettingsService'
], function (app) {

    app.controller('dashboardController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$cookieSettingsService', function ($scope,$rootScope,$location,$propertyService,$authService,$cookieSettingsService) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }
        $rootScope.nav = 'Dashboard'
        $rootScope.sideMenu = [];
        //window.renderable = true;

        $scope.localLoading = false;

        $scope.daterange=$cookieSettingsService.getDaterange();

        $scope.summary = $cookieSettingsService.getSummary();

        $scope.selectedBedroom = -1;
        $scope.bedrooms = [{value: -1, text: 'All'}]

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
            //$scope.nerData = {data: []};
            //$scope.occData = {data: []};
        }

        $propertyService.search({limit: 1000, permission: 'PropertyManage', active: true}).then(function (response) {
            $scope.myProperties = response.data.properties;


            var id = $rootScope.me.settings.defaultPropertyId;


            if (!$scope.myProperties || $scope.myProperties.length == 0) {
                id = null;
            }
            else if (!id) {
                $scope.selectedProperty = $scope.myProperties[0];
            } else {
                $scope.selectedProperty = _.find($scope.myProperties, function(x) {return x._id.toString() == id})
            }

            if ($scope.selectedProperty) {
                $scope.loadProperty($scope.selectedProperty._id)
            } else {
                $scope.localLoading = true;
            }

        })

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

        $scope.$on('data.reload', function(event, args) {
            $scope.changeProperty();
        });

        $scope.extractSeries = function(p, k) {
            var series = [];
            for(var prop in p) {
                var s = {data:[]};

                var comp = _.find($scope.comps, function(x) {return x._id == prop})
                s.name = comp.name;

                var data = p[prop][k];

                data.forEach(function(point) {
                    s.data.push([point.d, point.v])
                })


                series.push(s)
            }

            return series;
        }

        $scope.loadProperty = function(defaultPropertyId) {
            if (defaultPropertyId) {
                $scope.localLoading = false;
                $propertyService.dashboard(
                    defaultPropertyId
                    , $scope.summary
                    , $scope.selectedBedroom
                    , {daterange: $scope.daterange.selectedRange, start: $scope.daterange.selectedStartDate, end: $scope.daterange.selectedRange}).then(function (response) {
                    $scope.property = response.data.property;
                    $scope.comps = response.data.comps;

                    $scope.nerData = {title: 'Rent $', data: $scope.extractSeries(response.data.points, 'leases'), min: 0};
                    $scope.occData = {title: 'Occupancy %', data: $scope.extractSeries(response.data.points, 'occupancy'), min: 80};

                    $scope.mapOptions = {
                        loc: $scope.property.loc,
                        height: "300px",
                        width: "100%",
                        points: [{
                            loc: $scope.property.loc,
                            marker: 'apartment-3',
                            content: $scope.makrerContent($scope.property)
                        }]
                    }

                    $scope.comps = _.sortBy($scope.comps, function(n) {

                        if (n._id.toString() == $scope.property._id.toString()) {
                            return "-1";
                        }
                        return n.name;
                    })

                    $scope.comps.forEach(function(c, i) {
                        if (c._id.toString() != $scope.property._id.toString()) {
                            $scope.mapOptions.points.push({
                                loc: c.loc,
                                marker: 'number_' + i ,
                                content: $scope.makrerContent(c)
                            })
                        }
                    })
                    $scope.bedrooms = [{value: -1, text: 'All'}]

                    if ($scope.comps[0].survey && $scope.comps[0].survey.floorplans) {
                        var includedFps = _.filter($scope.comps[0].survey.floorplans, function (x) {
                            return !x.excluded
                        });

                        var bedrooms = _.groupBy(includedFps, function (x) {
                            return x.bedrooms
                        });

                        for (var b in bedrooms) {
                            switch (b) {
                                case 0:
                                    $scope.bedrooms.push({value: 0, text: 'Studios'})
                                    break;
                                default:
                                    $scope.bedrooms.push({value: b, text: b + ' Bdrs.'})
                                    break;
                            }
                        }

                        _.sortBy($scope.bedrooms, function (x) {
                            return x.value
                        })
                    }

                    $scope.selectBedroom();

                    $scope.localLoading = true;
                });
            }
        };

        $scope.selectBedroom = function() {
            $scope.bedroom = _.find($scope.bedrooms, function(x) {return x.value == $scope.selectedBedroom});

            if (!$scope.bedroom) {
                $scope.bedroom = $scope.bedrooms[0];
            }
        }

        $scope.makrerContent = function(property) {

            return "<div style='min-height:50px;min-width:150px'><a href='#/profile/" + property._id + "'>" + property.name + "</a><br />" + property.address + "</div>";
        }

    }]);
});