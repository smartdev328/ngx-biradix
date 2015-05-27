'use strict';
define([
    'app',
    '../../components/propertyProfile/profile',
    '../../components/googleMap/module'
], function (app) {

    app.controller('dashboardController', ['$scope','$rootScope','$location','$propertyService', '$authService', function ($scope,$rootScope,$location,$propertyService,$authService) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }
        $rootScope.nav = 'Dashboard'
        $rootScope.sideMenu = [];
        //window.renderable = true;

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

        $scope.loadProperty = function(defaultPropertyId) {
            if (defaultPropertyId) {
                $propertyService.search({limit: 1, permission: 'PropertyManage', _id: defaultPropertyId
                    , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated loc totalUnits"
                }).then(function (response) {
                    $scope.property = response.data.properties[0];
                    $scope.mapOptions = {
                        zoom : 9,
                        loc: $scope.property.loc,
                        height: "300px",
                        width: "100%",
                        points: [{loc:$scope.property.loc, marker: 'apartment-3', content: $scope.makrerContent($scope.property)}]
                    }
                    $scope.localLoading = true;
                });
            }
        };

        $scope.makrerContent = function(property) {

            return "<div style='min-height:50px;min-width:150px'><a href='#/profile/" + $scope.property._id + "'>" + $scope.property.name + "</a><br />" + $scope.property.address + "</div>";
        }

        $scope.$watch('mapOptions', function(){
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