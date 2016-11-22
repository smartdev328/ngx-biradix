'use strict';
define([
    'app',
    '../../services/gridService',
], function (app) {
    app.directive('rankingsReport', function () {
        return {
            restrict: 'E',
            scope: {
                subject: '=',
                comps: '=',
                report: '=',
                settings: '='
            },
            controller: function ($scope,$gridService) {

                $scope.sort = {nersqft:false}
                $scope.defaultSort = "nersqft";
                $scope.orderBy = "nersqft";

                $scope.report = _.sortByAll($scope.report, ['bedrooms', 'bathrooms'])

                $scope.reload = function() {
                    $scope.rankings = {}
                    $scope.report.forEach(function (fp) {

                        $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms] = $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms] || {};

                        $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].floorplans = $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].floorplans || [];

                        if ($scope.settings.hideUnlinked && fp.excluded) {
                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].excluded = true;
                        }  else {
                            var f = {
                                description: fp.description,
                                units: fp.units,
                                sqft: fp.sqft,
                                ner: fp.ner,
                                nersqft: fp.nersqft
                            };


                            if ($scope.subject._id == fp.id) {
                                f.name = $scope.subject.name;
                                f.subject = true;
                            } else {
                                f.name = _.find($scope.comps, function (x) {
                                    return x.id == fp.id
                                }).name;
                            }

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].floorplans.push(f);

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary = $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary || {};

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.units = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.units || 0) + fp.units;

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalsqft = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalsqft || 0) + fp.units * fp.sqft;

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalner = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalner || 0) + fp.units * fp.ner;

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalnersqft = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalnersqft || 0) + fp.units * fp.nersqft;
                        }
                    })

                    for (var fp in $scope.rankings) {
                        $scope.rankings[fp].summary.sqft = $scope.rankings[fp].summary.totalsqft / $scope.rankings[fp].summary.units;
                        $scope.rankings[fp].summary.ner = $scope.rankings[fp].summary.totalner / $scope.rankings[fp].summary.units;
                        $scope.rankings[fp].summary.nersqft = $scope.rankings[fp].summary.ner / $scope.rankings[fp].summary.sqft;
                    }
                }

                $scope.reload();

                $scope.$on('data.reload', function(event, args) {
                    $scope.reload();
                });

                $scope.toggleSort = function (v) {
                    $gridService.toggle($scope.sort, v, true)

                    var s = $scope.sort[v];

                    if (s == null) {
                        $scope.sort = {nersqft:false}
                        $scope.orderBy = $scope.defaultSort;
                        return;
                    }

                    if (s == true) {
                        $scope.orderBy = "-" + v;
                    }
                    else {
                        $scope.orderBy = v;
                    }
                }

            },
            templateUrl: '/components/reports/rankings.html?bust=' + version
        };
    })

})
