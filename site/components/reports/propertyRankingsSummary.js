'use strict';
define([
    'app',
    '../../services/gridService',
], function (app) {
    app.directive('rankingsReportSummary', function () {
        return {
            restrict: 'E',
            scope: {
                subject: '=',
                comps: '=',
                report: '=',
                settings: '='
            },
            controller: function ($scope,$gridService) {



                $scope.sort = {nersqft:true}
                $scope.defaultSort = "-nersqft";
                $scope.orderBy = "-nersqft";

                $scope.report = _.sortByAll($scope.report, ['bedrooms', 'bathrooms'])

                $scope.reload = function() {
                    $scope.rankings = {}
                    $scope.report.forEach(function (fp) {

                        $scope.rankings[fp.bedrooms] = $scope.rankings[fp.bedrooms] || {};

                        $scope.rankings[fp.bedrooms].floorplans =$scope.rankings[fp.bedrooms].floorplans || [];

                        if ($scope.settings.hideUnlinked && fp.excluded) {
                            $scope.rankings[fp.bedrooms].excluded = true;
                        }  else {
                            var f = {
                                description: fp.description,
                                units: fp.units,
                                sqft: fp.sqft,
                                ner: fp.ner,
                                nersqft: fp.nersqft
                            };


                            if ($scope.subject._id.toString() == fp.id.toString()) {
                                f.name = $scope.subject.name;
                                f.address = $scope.subject.address;
                                f.subject = true;
                            } else {
                                var p = _.find($scope.comps, function (x) {
                                    return x.id == fp.id
                                });

                                f.name = p.name;
                                f.address = p.address;
                            }

                            var p = _.find($scope.rankings[fp.bedrooms].floorplans, function(x) {return x.id == fp.id.toString() })

                            if (!p) {

                                p = {
                                    id: fp.id.toString(),
                                    name: f.name,
                                    description : f.address,
                                    subject: f.subject,
                                    units: fp.units,
                                    sqft: fp.sqft * fp.units,
                                    ner: fp.ner * fp.units,
                                    nersqft: fp.nersqft * fp.units
                                };

                                $scope.rankings[fp.bedrooms].floorplans.push(p);
                            } else {
                                p.units += fp.units;
                                p.sqft += (fp.sqft * fp.units);
                                p.ner += (fp.ner * fp.units);
                                p.nersqft += (fp.nersqft * fp.units);
                            }

                             $scope.rankings[fp.bedrooms].summary = $scope.rankings[fp.bedrooms].summary || {};

                            $scope.rankings[fp.bedrooms ].summary.units = ($scope.rankings[fp.bedrooms].summary.units || 0) + fp.units;

                            $scope.rankings[fp.bedrooms].summary.totalsqft = ($scope.rankings[fp.bedrooms].summary.totalsqft || 0) + fp.units * fp.sqft;

                            $scope.rankings[fp.bedrooms].summary.totalner = ($scope.rankings[fp.bedrooms].summary.totalner || 0) + fp.units * fp.ner;
                        }
                    })

                    for (var fp in $scope.rankings) {
                        $scope.rankings[fp].summary.sqft = $scope.rankings[fp].summary.totalsqft / $scope.rankings[fp].summary.units;
                        $scope.rankings[fp].summary.ner = $scope.rankings[fp].summary.totalner / $scope.rankings[fp].summary.units;
                        $scope.rankings[fp].floorplans.forEach(function(f) {
                            f.sqft = Math.round(f.sqft / f.units);
                            f.ner = f.ner / f.units;
                            f.nersqft = f.nersqft / f.units;
                        })

                        $scope.rankings[fp].summary.units = $scope.rankings[fp].summary.units / $scope.rankings[fp].floorplans.length;

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

                $scope.bedroomsLabel = function(i) {

                    switch (parseInt(i)) {
                        case 0:
                            return "Studios";
                        default:
                            return i + " Bedrooms";
                    }
                }                

            },
            templateUrl: '/components/reports/rankingsSummary.html?bust=' + version
        };
        
        
    })

})
