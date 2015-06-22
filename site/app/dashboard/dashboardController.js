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
            $scope.loadProperty($rootScope.me.settings.defaultPropertyId, true);
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
                    ,{ner: true, occupancy: true}
                ).then(function (response) {

                        if (!trendsOnly) {
                            $scope.property = response.data.property;
                            $scope.comps = response.data.comps;

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

                            $scope.comps = _.sortBy($scope.comps, function (n) {

                                if (n._id.toString() == $scope.property._id.toString()) {
                                    return "-1";
                                }
                                return n.name;
                            })

                            $scope.comps.forEach(function (c, i) {
                                if (c._id.toString() != $scope.property._id.toString()) {
                                    $scope.mapOptions.points.push({
                                        loc: c.loc,
                                        marker: 'number_' + i,
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
                        }

                        $scope.points = {excluded: response.data.points.excluded};
                        var ner = $propertyService.extractSeries(response.data.points, ['ner'],[],0,1000,0, $scope.comps, $scope.summary);
                        var occ = $propertyService.extractSeries(response.data.points, ['occupancy'],[],80,100,1, $scope.comps, $scope.summary);

                        $scope.nerData = {height:300, printWidth:860, prefix:'$',suffix:'', title: 'Net Eff. Rent $', marker: true, data: ner.data, min: ner.min, max: ner.max};
                        $scope.occData = {height:300, printWidth:860, prefix:'',suffix:'%',title: 'Occupancy %', marker: false, data: occ.data, min: ($scope.summary ? occ.min : 80), max: ($scope.summary ? occ.max : 100)};


                    $scope.localLoading = true;
                    $scope.trendsLoading = true;
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