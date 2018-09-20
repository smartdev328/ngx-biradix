angular.module('biradix.global').directive('rankingsReport', function () {
        return {
            restrict: 'E',
            scope: {
                subject: '=',
                comps: '=',
                report: '=',
                settings: '=',
                orderBy: '=',
                show: '='
            },
            controller: function ($scope,$gridService,$element) {


                $scope.$watch("orderBy", function() {
                    var v = $scope.orderBy;

                    var dir = v[0] == '-';
                    v = v.replace("-","");

                    $scope.sort = {};
                    $scope.sort[v] = dir;

                    // $scope.debug = {
                    //     o: $scope.orderBy,
                    //     s: $scope.sort
                    // }
                }, true);

                $scope.defaultSort = "nersqft";

                $scope.report = _.sortByAll($scope.report, ['bedrooms', 'bathrooms'])

                $scope.reload = function() {
                    $scope.exclusionsByBedrooms = {};
                    $scope.rankings = {}
                    $scope.report.forEach(function (fp) {
                        fp.bathrooms = (fp.bathrooms || '').toString().trim();

                        $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms] = $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms] || {};

                        $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].floorplans = $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].floorplans || [];

                        if (($scope.settings.hideUnlinked && fp.excluded) || (typeof fp.rent === "undefined" || fp.rent === null || isNaN(fp.rent))) {
                               $scope.exclusionsByBedrooms[fp.bedrooms + 'x' + fp.bathrooms] = true;
                        } else {
                            var f = {
                                description: fp.description,
                                units: fp.units,
                                sqft: fp.sqft,
                                ner: fp.ner,
                                nersqft: fp.nersqft,
                                runrate: fp.runrate,
                                runratesqft: fp.runratesqft,
                                rent: fp.rent,
                                mersqft: fp.mersqft
                                , concessionsMonthly: fp.concessionsMonthly
                                , concessionsOneTime: fp.concessionsOneTime
                                , concessions: fp.concessions,
                                id: fp.id,
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

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalrunrate = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalrunrate || 0) + fp.units * fp.runrate;

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalrunratesqft = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalrunratesqft || 0) + fp.units * fp.runratesqft;

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalrent = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalrent || 0) + fp.units * fp.rent;

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalmersqft = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalmersqft || 0) + fp.units * fp.mersqft;

                            $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalconcessions = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalconcessions || 0) + fp.units * fp.concessions;

                            if (typeof fp.concessionsMonthly != 'undefined' && fp.concessionsMonthly != null && !isNaN(fp.concessionsMonthly)) {
                                $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.unitsDetailed = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.unitsDetailed || 0) + fp.units;
                                $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalconcessionsMonthly = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalconcessionsMonthly || 0) + fp.units * fp.concessionsMonthly;
                                $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalconcessionsOneTime = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalconcessionsOneTime || 0) + fp.units * fp.concessionsOneTime;
                            }

                        }
                    })

                    for (var fp in $scope.rankings) {

                        if (!$scope.rankings[fp].summary) {
                            delete $scope.rankings[fp];
                        } else {
                            $scope.rankings[fp].summary.sqft = $scope.rankings[fp].summary.totalsqft / $scope.rankings[fp].summary.units;
                            $scope.rankings[fp].summary.ner = $scope.rankings[fp].summary.totalner / $scope.rankings[fp].summary.units;
                            $scope.rankings[fp].summary.nersqft = $scope.rankings[fp].summary.ner / $scope.rankings[fp].summary.sqft;
                            $scope.rankings[fp].summary.runrate = $scope.rankings[fp].summary.totalrunrate / $scope.rankings[fp].summary.units;
                            $scope.rankings[fp].summary.runratesqft = $scope.rankings[fp].summary.runrate / $scope.rankings[fp].summary.sqft;
                            $scope.rankings[fp].summary.rent = $scope.rankings[fp].summary.totalrent / $scope.rankings[fp].summary.units;
                            $scope.rankings[fp].summary.mersqft = $scope.rankings[fp].summary.rent / $scope.rankings[fp].summary.sqft;
                            $scope.rankings[fp].summary.concessions = $scope.rankings[fp].summary.totalconcessions / $scope.rankings[fp].summary.units;

                            if ($scope.rankings[fp].summary.unitsDetailed && $scope.rankings[fp].summary.unitsDetailed > 0) {
                                $scope.rankings[fp].summary.concessionsMonthly = $scope.rankings[fp].summary.totalconcessionsMonthly / $scope.rankings[fp].summary.unitsDetailed;
                                $scope.rankings[fp].summary.concessionsOneTime = $scope.rankings[fp].summary.totalconcessionsOneTime / $scope.rankings[fp].summary.unitsDetailed;
                            }

                            $scope.rankings[fp].summary.units = $scope.rankings[fp].summary.units / $scope.rankings[fp].floorplans.length;


                        }
                    }

                    // window.setTimeout(function() {
                    //     var el = $($element).find('.break');
                    //     var height = el.height();
                    //
                    //     if (height >= 1500 && height <= 1700) {
                    //         el.height(el.height() + 5);
                    //     }
                    // },100)
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
