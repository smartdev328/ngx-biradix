'use strict';
define([
    'app',
    '../../components/propertyProfile/profile',
    '../../components/propertyProfile/comps',
    '../../components/googleMap/module',
    '../../components/toggle/module',
    '../../components/daterangepicker/module',
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
            $scope.historicalData = [];
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

                    $scope.historicalData = [];

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

        $scope.$watch('historicalData', function(){
            if ($scope.mapOptions) {
                window.setTimeout(function () {
                    $(function () {
                        $('#container').highcharts({
                            title: {
                                text: 'Monthly Average Temperature',
                                x: -20 //center
                            },
                            subtitle: {
                                text: 'Source: WorldClimate.com',
                                x: -20
                            },
                            xAxis: {
                                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                            },
                            yAxis: {
                                title: {
                                    text: 'Temperature (°C)'
                                },
                                plotLines: [{
                                    value: 0,
                                    width: 1,
                                    color: '#808080'
                                }]
                            },
                            tooltip: {
                                valueSuffix: '°C'
                            },
                            legend: {
                                layout: 'horizontal',
                                align: 'left',
                                verticalAlign: 'bottom',
                                borderWidth: 0
                            },
                            series: [{
                                name: 'Tokyo',
                                data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
                            }, {
                                name: 'New York',
                                data: [-0.2, 0.8, 5.7, 11.3, 17.0, 22.0, 24.8, 24.1, 20.1, 14.1, 8.6, 2.5]
                            }, {
                                name: 'Berlin',
                                data: [-0.9, 0.6, 3.5, 8.4, 13.5, 17.0, 18.6, 17.9, 14.3, 9.0, 3.9, 1.0]
                            }, {
                                name: 'London',
                                data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
                            }]
                        });
                    });

                    $(function () {
                        $('#container2').highcharts({
                            title: {
                                text: 'Monthly Average Temperature',
                                x: -20 //center
                            },
                            subtitle: {
                                text: 'Source: WorldClimate.com',
                                x: -20
                            },
                            xAxis: {
                                categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                            },
                            yAxis: {
                                title: {
                                    text: 'Temperature (°C)'
                                },
                                plotLines: [{
                                    value: 0,
                                    width: 1,
                                    color: '#808080'
                                }]
                            },
                            tooltip: {
                                valueSuffix: '°C'
                            },
                            legend: {
                                layout: 'horizontal',
                                align: 'left',
                                verticalAlign: 'bottom',
                                borderWidth: 0
                            },
                            series: [{
                                name: 'Tokyo',
                                data: [7.0, 6.9, 9.5, 14.5, 18.2, 21.5, 25.2, 26.5, 23.3, 18.3, 13.9, 9.6]
                            }, {
                                name: 'New York',
                                data: [-0.2, 0.8, 5.7, 11.3, 17.0, 22.0, 24.8, 24.1, 20.1, 14.1, 8.6, 2.5]
                            }, {
                                name: 'Berlin',
                                data: [-0.9, 0.6, 3.5, 8.4, 13.5, 17.0, 18.6, 17.9, 14.3, 9.0, 3.9, 1.0]
                            }, {
                                name: 'London',
                                data: [3.9, 4.2, 5.7, 8.5, 11.9, 15.2, 17.0, 16.6, 14.2, 10.3, 6.6, 4.8]
                            }]
                        });
                    });

                }, 500)
            }
        });


    }]);
});