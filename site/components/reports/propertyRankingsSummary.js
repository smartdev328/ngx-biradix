angular.module('biradix.global').directive('rankingsReportSummary', function () {
        return {
            restrict: 'E',
            scope: {
                subject: '=',
                comps: '=',
                report: '=',
                settings: '=',
                orderBy: '=',
                show:'='
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

                $scope.report = _.sortByAll($scope.report, ['bedrooms', 'bathrooms']);

                $scope.exclusions = {};
                $scope.exclusionsByBedrooms = {};
                $scope.exclusionBySubject = false;

                $scope.reload = function() {
                    $scope.rankings = {};
                    $scope.summary = [];
                    $scope.totals = {};
                    $scope.excluded = false;
                    $scope.report.forEach(function(fp) {
                        $scope.rankings[fp.bedrooms] = $scope.rankings[fp.bedrooms] || {};

                        $scope.rankings[fp.bedrooms].floorplans =$scope.rankings[fp.bedrooms].floorplans || [];
                        $scope.rankings[fp.bedrooms].excluded = $scope.rankings[fp.bedrooms].excluded || {};

                        if (($scope.settings.hideUnlinked && fp.excluded) || (typeof fp.rent === "undefined" || fp.rent === null || isNaN(fp.rent))) {
                            $scope.rankings[fp.bedrooms].excluded[fp.id] = true;
                            $scope.exclusions[fp.id] = true;
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
                                , concessions: fp.concessions
                            };


                            if ($scope.subject._id.toString() === fp.id.toString()) {
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
                                    description: f.address,
                                    subject: f.subject,
                                    units: fp.units,
                                    sqft: fp.sqft * fp.units,
                                    ner: fp.ner * fp.units,
                                    nersqft: fp.nersqft * fp.units,
                                    runrate: fp.runrate * fp.units,
                                    runratesqft: fp.runratesqft * fp.units,
                                    rent: fp.rent* fp.units,
                                    mersqft: fp.mersqft * fp.units,
                                    concessions: fp.concessions * fp.units
                                };

                                if (typeof fp.concessionsMonthly != 'undefined' && fp.concessionsMonthly != null && !isNaN(fp.concessionsMonthly)) {
                                    p.concessionsMonthly = fp.concessionsMonthly * fp.units;
                                    p.concessionsOneTime = fp.concessionsOneTime * fp.units;
                                    p.unitsDetailed = fp.units;
                                } else {
                                    p.unitsDetailed = 0;
                                }

                                $scope.rankings[fp.bedrooms].floorplans.push(p);
                            } else {
                                p.units += fp.units;
                                p.sqft += (fp.sqft * fp.units);
                                p.ner += (fp.ner * fp.units);
                                p.nersqft += (fp.nersqft * fp.units);
                                p.runrate += (fp.runrate * fp.units);
                                p.runratesqft += (fp.runratesqft * fp.units);
                                p.rent += (fp.rent * fp.units);
                                p.mersqft += (fp.mersqft * fp.units);
                                p.concessions += (fp.concessions * fp.units);

                                if (typeof fp.concessionsMonthly != 'undefined' && fp.concessionsMonthly != null && !isNaN(fp.concessionsMonthly)) {
                                    p.concessionsMonthly = p.concessionsMonthly || 0;
                                    p.concessionsOneTime = p.concessionsOneTime || 0;
                                    p.concessionsMonthly += fp.concessionsMonthly * fp.units;
                                    p.concessionsOneTime += fp.concessionsOneTime * fp.units;
                                    p.unitsDetailed += fp.units;
                                }
                            }

                            var s = _.find($scope.summary, function(x) {return x.id == fp.id.toString() })

                            if (!s) {
                                 s = {
                                    id: fp.id.toString(),
                                    name: f.name,
                                    description: f.address,
                                    subject: f.subject,
                                    units: fp.units,
                                    sqft: fp.sqft * fp.units,
                                    ner: fp.ner * fp.units,
                                    nersqft: fp.nersqft * fp.units,
                                    runrate: fp.runrate * fp.units,
                                    runratesqft: fp.runratesqft * fp.units,
                                    rent: fp.rent * fp.units,
                                    mersqft: fp.mersqft * fp.units,
                                    concessions: fp.concessions * fp.units,
                                };


                                if (typeof fp.concessionsMonthly != 'undefined' && fp.concessionsMonthly != null && !isNaN(fp.concessionsMonthly)) {
                                    s.concessionsMonthly = fp.concessionsMonthly * fp.units;
                                    s.concessionsOneTime = fp.concessionsOneTime * fp.units;
                                    s.unitsDetailed = fp.units;
                                } else {
                                    s.unitsDetailed = 0;
                                }


                                $scope.summary.push(s);
                            } else {
                                s.units += fp.units;
                                s.sqft += (fp.sqft * fp.units);
                                s.ner += (fp.ner * fp.units);
                                s.nersqft += (fp.nersqft * fp.units);
                                s.runrate += (fp.runrate * fp.units);
                                s.runratesqft += (fp.runratesqft * fp.units);
                                s.rent += (fp.rent * fp.units);
                                s.mersqft += (fp.mersqft * fp.units);
                                s.concessions += (fp.concessions * fp.units);


                                if (typeof fp.concessionsMonthly != 'undefined' && fp.concessionsMonthly != null && !isNaN(fp.concessionsMonthly)) {
                                    s.concessionsMonthly = s.concessionsMonthly || 0;
                                    s.concessionsOneTime = s.concessionsOneTime || 0;
                                    s.concessionsMonthly += (fp.concessionsMonthly * fp.units);
                                    s.concessionsOneTime += (fp.concessionsOneTime * fp.units);
                                    s.unitsDetailed += fp.units;
                                }

                            }


                            $scope.rankings[fp.bedrooms].summary = $scope.rankings[fp.bedrooms].summary || {};
                            $scope.rankings[fp.bedrooms].summary.units = ($scope.rankings[fp.bedrooms].summary.units || 0) + fp.units;
                            $scope.rankings[fp.bedrooms].summary.totalsqft = ($scope.rankings[fp.bedrooms].summary.totalsqft || 0) + fp.units * fp.sqft;
                            $scope.rankings[fp.bedrooms].summary.totalner = ($scope.rankings[fp.bedrooms].summary.totalner || 0) + fp.units * fp.ner;
                            $scope.rankings[fp.bedrooms].summary.totalnersqft = ($scope.rankings[fp.bedrooms].summary.totalnersqft || 0) + fp.units * fp.nersqft;
                            $scope.rankings[fp.bedrooms].summary.totalrunrate = ($scope.rankings[fp.bedrooms].summary.totalrunrate || 0) + fp.units * fp.runrate;
                            $scope.rankings[fp.bedrooms].summary.totalrunratesqft = ($scope.rankings[fp.bedrooms].summary.totalrunratesqft || 0) + fp.units * fp.runratesqft;
                            $scope.rankings[fp.bedrooms].summary.totalrent = ($scope.rankings[fp.bedrooms].summary.totalrent || 0) + fp.units * fp.rent;
                            $scope.rankings[fp.bedrooms].summary.totalmersqft = ($scope.rankings[fp.bedrooms].summary.totalmersqft || 0) + fp.units * fp.mersqft;
                            $scope.rankings[fp.bedrooms].summary.totalconcessions = ($scope.rankings[fp.bedrooms].summary.totalconcessions || 0) + fp.units * fp.concessions;

                            if (typeof fp.concessionsMonthly != 'undefined' && fp.concessionsMonthly != null && !isNaN(fp.concessionsMonthly)) {
                                $scope.rankings[fp.bedrooms].summary.unitsDetailed = ($scope.rankings[fp.bedrooms].summary.unitsDetailed || 0) + fp.units;
                                $scope.rankings[fp.bedrooms].summary.totalconcessionsMonthly = ($scope.rankings[fp.bedrooms].summary.totalconcessionsMonthly || 0) + fp.units * fp.concessionsMonthly;
                                $scope.rankings[fp.bedrooms].summary.totalconcessionsOneTime = ($scope.rankings[fp.bedrooms].summary.totalconcessionsOneTime || 0) + fp.units * fp.concessionsOneTime;
                            }

                            $scope.totals.units = ($scope.totals.units || 0) + fp.units;
                            $scope.totals.totalsqft = ($scope.totals.totalsqft || 0) + fp.units * fp.sqft;
                            $scope.totals.totalner = ($scope.totals.totalner || 0) + fp.units * fp.ner;
                            $scope.totals.totalnersqft = ($scope.totals.totalnersqft || 0) + fp.units * fp.nersqft;
                            $scope.totals.totalrunrate = ($scope.totals.totalrunrate || 0) + fp.units * fp.runrate;
                            $scope.totals.totalrunratesqft = ($scope.totals.totalrunratesqft || 0) + fp.units * fp.runratesqft;
                            $scope.totals.totalrent = ($scope.totals.totalrent || 0) + fp.units * fp.rent;
                            $scope.totals.totalmersqft = ($scope.totals.totalmersqft || 0) + fp.units * fp.mersqft;
                            $scope.totals.totalconcessions = ($scope.totals.totalconcessions || 0) + fp.units * fp.concessions;

                            if (typeof fp.concessionsMonthly != 'undefined' && fp.concessionsMonthly != null && !isNaN(fp.concessionsMonthly)) {
                                $scope.totals.unitsDetailed = ($scope.totals.unitsDetailed || 0) + fp.units;
                                $scope.totals.totalconcessionsMonthly = ($scope.totals.totalconcessionsMonthly || 0) + fp.units * fp.concessionsMonthly;
                                $scope.totals.totalconcessionsOneTime = ($scope.totals.totalconcessionsOneTime || 0) + fp.units * fp.concessionsOneTime;
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

                            $scope.rankings[fp].floorplans.forEach(function (f) {
                                f.sqft = f.sqft / f.units;
                                f.ner = f.ner / f.units;
                                f.nersqft = f.ner / f.sqft;
                                f.runrate = f.runrate / f.units;
                                f.runratesqft = f.runrate / f.sqft;
                                f.unitpercent = f.units / $scope.rankings[fp].summary.units * 100;
                                f.rent = f.rent / f.units;
                                f.mersqft = f.rent / f.sqft;
                                f.concessions = f.concessions / f.units;

                                if (f.unitsDetailed && f.unitsDetailed > 0) {
                                    f.concessionsMonthly = f.concessionsMonthly / f.unitsDetailed;
                                    f.concessionsOneTime = f.concessionsOneTime / f.unitsDetailed;
                                }

                            })

                            $scope.rankings[fp].summary.units = $scope.rankings[fp].summary.units / $scope.rankings[fp].floorplans.length;
                        }

                    }

                    $scope.summary.forEach(function(f) {
                        f.sqft = Math.round(f.sqft / f.units);
                        f.ner = f.ner / f.units;
                        f.nersqft = f.ner / f.sqft;
                        f.runrate = f.runrate / f.units;
                        f.runratesqft = f.runrate / f.sqft;
                        f.unitpercent = f.units / $scope.totals.units * 100;
                        f.rent = f.rent / f.units;
                        f.mersqft = f.rent / f.sqft;
                        f.concessions = f.concessions / f.units;


                        if (f.unitsDetailed && f.unitsDetailed > 0) {
                            f.concessionsMonthly = f.concessionsMonthly / f.unitsDetailed;
                            f.concessionsOneTime = f.concessionsOneTime / f.unitsDetailed;
                        }
                    })

                    $scope.totals.sqft = $scope.totals.totalsqft / $scope.totals.units;
                    $scope.totals.ner = $scope.totals.totalner / $scope.totals.units;
                    $scope.totals.nersqft = $scope.totals.ner / $scope.totals.sqft;
                    $scope.totals.runrate = $scope.totals.totalrunrate / $scope.totals.units;
                    $scope.totals.runratesqft = $scope.totals.runrate / $scope.totals.sqft;
                    $scope.totals.rent = $scope.totals.totalrent / $scope.totals.units;
                    $scope.totals.mersqft = $scope.totals.rent / $scope.totals.sqft;
                    $scope.totals.concessions = $scope.totals.totalconcessions / $scope.totals.units;


                    if ($scope.totals.unitsDetailed && $scope.totals.unitsDetailed > 0) {
                        $scope.totals.concessionsMonthly = $scope.totals.totalconcessionsMonthly / $scope.totals.unitsDetailed;
                        $scope.totals.concessionsOneTime = $scope.totals.totalconcessionsOneTime / $scope.totals.unitsDetailed;
                    }

                    $scope.totals.unitsTotal = $scope.totals.units;
                    $scope.totals.unitpercent = 100;
                    $scope.totals.units = $scope.totals.units / $scope.summary.length;

                    // Check if excluded property is missing so we can add it to the top level;
                    for(var e in $scope.exclusions) {
                        if (!_.find($scope.summary, function(x) {
                            return x.id.toString() === e;
                        })) {
                            $scope.exclusionBySubject = true;
                        }
                    }

                    // Do the same thing for each group;
                    for(var bedroom in $scope.rankings) {
                        for(var e in $scope.rankings[bedroom].excluded) {
                            if (!_.find($scope.rankings[bedroom].floorplans, function(x) {
                                return x.id.toString() === e;
                            })) {
                                $scope.exclusionsByBedrooms[bedroom] = true;
                            }
                        }
                    }

                    // Phantom JS hack. if the report fits the page exactly, add more pixesl so it doesnt leave a blank logo on the previous page
                    if (phantom) {
                        window.setTimeout(function () {
                            var el = $($element).find('.break');
                            var height = el.height();
                            // $scope.debug = height;

                            if (height >= 1580 && height <= 1660) {
                                el.height(1660);
                            }
                        }, 50)
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
