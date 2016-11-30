'use strict';
define([
    'app',
], function (app) {
    app.directive('marketshareReport', function () {
        return {
            restrict: 'E',
            scope: {
                subject: '=',
                comps: '=',
                report: '=',
                settings: '='
            },
            controller: function ($scope) {

                $scope.report = _.sortByAll($scope.report, ['bedrooms', 'bathrooms', 'id', 'sqft', 'description', 'fid'])

                $scope.reload = function() {
                    $scope.rankings = {}
                    var last = "";
                    var lbedrooms = "";
                    var lbathrooms = "";
                    $scope.report.forEach(function (fp) {

                        $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms] = $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms] || {};

                        $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].floorplans = $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].floorplans || [];

                        if ($scope.settings.hideUnlinked && fp.excluded) {
                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].excluded = true;
                        }  else {
                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].share = $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].share || {};
                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].share[fp.id] = $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].share[fp.id] || {};

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].share[fp.id].units = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].share[fp.id].units || 0) + fp.units;
                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].share[fp.id].count = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].share[fp.id].count || 0) + 1;
                            var f = {
                                fid: fp.fid.toString(),
                                description: fp.description,
                                units: fp.units,
                                sqft: fp.sqft,
                                ner: fp.ner,
                                nersqft: fp.nersqft,
                                first: fp.id.toString() != last.toString() || fp.bedrooms.toString() != lbedrooms.toString() || fp.bathrooms.toString() != lbathrooms.toString() ,
                                id: fp.id.toString()
                            };

                            if ($scope.subject._id.toString() == fp.id.toString()) {
                                f.name = $scope.subject.name;
                                f.subject = true;
                            } else {
                                f.name = _.find($scope.comps, function (x) {
                                    return x.id.toString() == fp.id.toString()
                                }).name;
                            }

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].floorplans.push(f);

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary = $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary || {};

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.units = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.units || 0) + fp.units;

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalsqft = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalsqft || 0) + fp.units * fp.sqft;

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalner = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalner || 0) + fp.units * fp.ner;


                            last = fp.id.toString();
                            lbedrooms = fp.bedrooms;
                            lbathrooms = fp.bathrooms;
                        }
                    })

                    for (var fp in $scope.rankings) {
                        if (!$scope.rankings[fp].summary) {
                            delete $scope.rankings[fp];
                        } else {
                            $scope.rankings[fp].summary.sqft = $scope.rankings[fp].summary.totalsqft / $scope.rankings[fp].summary.units;
                            $scope.rankings[fp].summary.ner = $scope.rankings[fp].summary.totalner / $scope.rankings[fp].summary.units;
                        }
                    }
                }

                $scope.reload();

                $scope.$on('data.reload', function(event, args) {
                    $scope.reload();
                });

            },
            templateUrl: '/components/reports/marketshare.html?bust=' + version
        };
    })

})
