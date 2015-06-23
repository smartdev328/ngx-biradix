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
    '../../services/cookieSettingsService'
], function (app) {

    app.controller('profileController', ['$scope','$rootScope','$location','$propertyService', '$authService', '$stateParams', '$window','$cookies', 'ngProgress', '$progressService', '$cookieSettingsService', function ($scope,$rootScope,$location,$propertyService,$authService, $stateParams, $window, $cookies, ngProgress, $progressService, $cookieSettingsService) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }
        $rootScope.nav = ''
        $rootScope.sideMenu = [];

        $scope.setRenderable = function() {
            window.setTimeout(function() {
                window.renderable = true;
            },100)
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
                        if (!trendsOnly) {
                            $scope.lookups = response.data.lookups;


                            if (!response.data.properties) {
                                $location.path('/dashboard')
                                return;
                            } else {
                                $scope.property = response.data.properties[0];
                                $scope.canManage = response.data.canManage;
                                $scope.comp = response.data.comps[0];
                            }
                            $scope.localLoading = true;
                            $window.document.title = $scope.property.name;

                            $scope.property.hasName = $scope.property.contactName && $scope.property.contactName.length > 0;
                            $scope.property.hasEmail = $scope.property.contactEmail && $scope.property.contactEmail.length > 0;
                            $scope.property.hasNotes = $scope.property.notes && $scope.property.notes.length > 0;
                            $scope.property.hasContact = $scope.property.hasName || $scope.property.hasEmail;
                            $scope.property.notes = $scope.property.notes.replace(/(?:\r\n|\r|\n)/g, '<br />');

                            $scope.property.hasFees = false;
                            if ($scope.property.fees) {
                                for (var fee in $scope.property.fees) {
                                    if ($scope.property.fees[fee].length > 0) {
                                        $scope.property.hasFees = true;
                                    }
                                }
                            }

                            $scope.property.location_am = [];
                            $scope.property.location_amenities.forEach(function (la) {
                                var am = _.find($scope.lookups.amenities, function (a) {
                                    return a._id.toString() == la.toString()
                                })
                                if (am) {
                                    $scope.property.location_am.push(am.name)
                                }
                            })

                            $scope.property.community_am = [];
                            $scope.property.community_amenities.forEach(function (la) {
                                var am = _.find($scope.lookups.amenities, function (a) {
                                    return a._id.toString() == la.toString()
                                })
                                if (am) {
                                    $scope.property.community_am.push(am.name)
                                }
                            })

                            $scope.property.floorplan_am = [];
                            $scope.property.floorplans.forEach(function (fp) {
                                fp.amenities.forEach(function (la) {
                                    var am = _.find($scope.lookups.amenities, function (a) {
                                        return a._id.toString() == la.toString()
                                    })
                                    if (am) {
                                        if ($scope.property.floorplan_am.indexOf(am.name) == -1)
                                            $scope.property.floorplan_am.push(am.name)
                                    }
                                })
                            })
                        }

                        $scope.points = {excluded: response.data.points.excluded};

                        var keys = ['ner'];
                        var labels = ['Entire Property'];

                        var pts = response.data.points[$scope.propertyId];

                        if (pts) {
                            for (var p in pts) {
                                if (!isNaN(p)) {
                                    keys.push(p)
                                    labels.push(p + ' Bedrooms')
                                }
                            }

                            $scope.surveyData = pts.surveys;
                        }


                        var ner = $propertyService.extractSeries(response.data.points, keys,labels,0,1000,0, [$scope.property], false);
                        var occ = $propertyService.extractSeries(response.data.points, ['occupancy'],['Occupancy %'],80,100,1, [$scope.property], false);
                        var other = $propertyService.extractSeries(response.data.points, ['traffic','leases'],['Traffic/Wk','Leases/Wk'],0,10,0, [$scope.property], false);



                        $scope.nerData = {height:300, printWidth:860, prefix:'$',suffix:'', title: 'Net Eff. Rent $', marker: true, data: ner.data, min: ner.min, max: ner.max};
                        $scope.occData = {height:250, printWidth:420, prefix:'',suffix:'%',title: 'Occupancy %', marker: false, data: occ.data, min: ($scope.summary ? occ.min : 80), max: ($scope.summary ? occ.max : 100)};
                        $scope.otherData = {height:250, printWidth:420, prefix:'',suffix:'', title: 'Traffic, Leases / Week', marker: true, data: other.data, min: other.min, max: other.max};


                        $scope.localLoading = true;
                        $scope.trendsLoading = true;

                        if (pts && !$scope.graphs) {
                            $scope.nerKeys = keys;
                            $scope.otherTable = $scope.extractTableViews($scope.surveyData, $scope.occData, pts, keys);
                        }

                        $scope.setRenderable();


                });
            }
        };

        $scope.extractTableViews = function(surveys, occupancy, pts, nerColumns) {
            var table = [];

            occupancy.data[0].data.forEach(function(o) {

                var tr = _.find(pts['traffic'], function(x) {return x.d == o[0]})
                var ls = _.find(pts['leases'], function(x) {return x.d == o[0]})

                var row = {d: o[0], occ: o[1], traffic: tr.v, leases: ls.v}

                nerColumns.forEach(function(k) {
                    var n = _.find(pts[k], function(x) {return x.d == o[0]})

                    row[k] = n.v
                })


                table.push(row);
            } )

            table = _.sortBy(table, function(x) {return -x.d})

            return table;

        }

        $scope.loadProperty($scope.propertyId)

        $scope.$on('data.reload', function(event, args) {
            $scope.loadProperty($scope.propertyId)
        });

        $scope.print = function() {
            $window.print();
        }

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
            url += "&progressId=" + $scope.progressId

            $window.setTimeout($scope.checkProgress, 500);

            location.href = url;

        }

        $scope.pdf = function() {

            ngProgress.start();

            $('#export').prop('disabled', true);

            $scope.progressId = _.random(1000000, 9999999);

            var url = '/api/1.0/properties/' + $scope.property._id + '/pdf?'
            url += "token=" + $cookies.get('token')
            url += "&Graphs=" + $scope.graphs
            url += "&selectedStartDate=" + $scope.daterange.selectedStartDate.format()
            url += "&selectedEndDate=" + $scope.daterange.selectedEndDate.format()
            url += "&selectedRange=" + $scope.daterange.selectedRange
            url += "&timezone=" + moment().utcOffset()
            url += "&progressId=" + $scope.progressId


            $window.setTimeout($scope.checkProgress, 500);

            location.href = url;

        }

    }]);
});