angular.module('biradix.global').directive('propertyComps', function () {
        return {
            restrict: 'E',
            scope: {
                comps: '=',
                orderBy: '=',
                show: '=',
                canSurvey: '=',
                roles: '=',
                showTotals:'=',
                skipcookie: '=',
                appliedPerspective: '='
            },
            controller: function ($scope, $rootScope, $gridService, $cookies, $sce) {
                $scope.defaultSort = ""

                if ($scope.show && typeof $scope.show == "string") {
                    $scope.show = JSON.parse($scope.show);
                }

                $scope.$watch("orderBy", function() {
                    if ($scope.orderBy) {
                        $scope.sort = {}
                        var x = $scope.orderBy.replace("-","");
                        $scope.sort[x] = $scope.orderBy[0] == "-";
                    }
                }, true)


                $scope.surveyTooltip = {};
                $scope.$watch("comps", function() {
                    if ($scope.comps) {

                        $scope.totals = {units : 0, totalUnits : 0};
                        $scope.totalSurveys = 0;

                        var j,b;
                        $scope.comps.forEach(function(comp, i) {
                            comp.number = i;
                            comp.units = comp.survey.totUnits;
                            comp.unitPercent = 100;
                            comp.sqft = comp.survey.sqft == null ? -1 : comp.survey.sqft;
                            comp.rent = comp.survey.rent == null ? -1 : comp.survey.rent;
                            comp.mersqft = comp.survey.mersqft == null ? -1 : comp.survey.mersqft;
                            comp.runrate = comp.survey.runrate == null ? -1 : comp.survey.runrate;
                            comp.runratesqft = comp.survey.runratesqft == null ? -1 : comp.survey.runratesqft;
                            comp.concessions = comp.survey.concessions == null ? -1 : comp.survey.concessions;
                            comp.ner = comp.survey.ner == null ? -1 : comp.survey.ner;
                            comp.nersqft = comp.survey.nersqft == null ? -1 : comp.survey.nersqft;
                            comp.occupancy = comp.survey.occupancy == null ? -1 : comp.survey.occupancy;
                            comp.leased = comp.survey.leased == null ? -1 : comp.survey.leased;
                            comp.atr_percent = comp.survey.atr_percent == null ? -1 : comp.survey.atr_percent;
                            comp.renewal = comp.survey.renewal == null ? -1 : comp.survey.renewal;
                            comp.weeklytraffic = comp.survey.weeklytraffic == null ? -1 : comp.survey.weeklytraffic;
                            comp.weeklyleases = comp.survey.weeklyleases == null ? -1 : comp.survey.weeklyleases;

                            $scope.totals.totalUnits += comp.survey.totUnits;
                            if (comp.survey && comp.survey.rent) {
                                $scope.totalSurveys += 1;
                                $scope.totals.units = ($scope.totals.units || 0) +  comp.units;
                                $scope.totals.sqft = ($scope.totals.sqft || 0) +  comp.survey.sqft * comp.units;

                                if (typeof comp.survey.occupancy != 'undefined' && comp.survey.occupancy != null) {
                                    $scope.totals.occupancy = ($scope.totals.occupancy || 0) + comp.survey.occupancy * comp.units;
                                    $scope.totals.unitsOccupancy = ($scope.totals.unitsOccupancy || 0) +  comp.units;
                                }

                                if (typeof comp.survey.leased != 'undefined' && comp.survey.leased != null) {
                                    $scope.totals.leased = ($scope.totals.leased || 0) + comp.survey.leased * comp.units;
                                    $scope.totals.unitsLeased = ($scope.totals.unitsLeased || 0) +  comp.units;
                                }

                                if (typeof comp.atr_percent != 'undefined' && comp.atr_percent != null && comp.atr_percent > -1) {
                                    $scope.totals.atr_percent = ($scope.totals.atr_percent || 0) + comp.atr_percent  * comp.units;
                                    $scope.totals.unitsAtr = ($scope.totals.unitsAtr || 0) +  comp.units;
                                }

                                if (typeof comp.survey.renewal != 'undefined' && comp.survey.renewal != null) {
                                    $scope.totals.renewal = ($scope.totals.renewal || 0) + comp.survey.renewal * comp.units;
                                    $scope.totals.unitsRenewal = ($scope.totals.unitsRenewal || 0) +  comp.units;
                                }

                                $scope.totals.weeklytraffic = ($scope.totals.weeklytraffic || 0)+  comp.survey.weeklytraffic * comp.units;
                                $scope.totals.weeklyleases = ($scope.totals.weeklyleases || 0)+  comp.survey.weeklyleases * comp.units;

                                $scope.totals.rent = ($scope.totals.rent || 0)+  comp.survey.rent * comp.units;
                                $scope.totals.mersqft = ($scope.totals.mersqft || 0)+  comp.survey.mersqft * comp.units;
                                $scope.totals.concessions = ($scope.totals.concessions || 0)+  comp.survey.concessions * comp.units;
                                $scope.totals.ner = ($scope.totals.ner || 0)+  comp.survey.ner * comp.units;
                                $scope.totals.nersqft = ($scope.totals.nersqft || 0)+  comp.survey.nersqft * comp.units;
                                $scope.totals.runrate = ($scope.totals.runrate || 0)+  comp.survey.runrate * comp.units;
                                $scope.totals.runratesqft = ($scope.totals.runratesqft || 0)+  comp.survey.runratesqft * comp.units;
                            }

                            comp.survey.floorplans.forEach(function(fp,i) {
                                fp.number = i;
                                fp.unitPercent = fp.units / comp.survey.totUnits * 100;

                                if (typeof fp.description == "undefined" || fp.description === "" || fp.description == null) {
                                    fp.name = fp.bedrooms + "x" + fp.bathrooms;
                                } else {
                                    fp.name = fp.bedrooms + "x" + fp.bathrooms + " " + fp.description;
                                }

                            })

                            j = 0;
                            comp.bedrooms = [];
                            for (b in comp.survey.bedrooms) {
                                comp.survey.bedrooms[b].bedrooms = b;
                                comp.survey.bedrooms[b].name = $scope.bedroomsLabel(b);
                                comp.survey.bedrooms[b].number = j;
                                comp.survey.bedrooms[b].units = comp.survey.bedrooms[b].totUnits;
                                comp.survey.bedrooms[b].unitPercent = comp.survey.bedrooms[b].units / comp.survey.totUnits * 100;
                                j++;
                                comp.bedrooms[b] = comp.survey.bedrooms[b];
                            }
                        });

                        $scope.totals.totalUnits /= $scope.comps.length;
                        
                        if ($scope.totalSurveys > 0) {
                            $scope.totals.sqft = ($scope.totals.sqft || 0) / $scope.totals.units;

                            if (!$scope.totals.unitsOccupancy) {
                                $scope.totals.occupancy = 0
                            } else {
                                $scope.totals.occupancy = Math.round(($scope.totals.occupancy || 0) / $scope.totals.unitsOccupancy * 10) / 10;
                            }

                            if (!$scope.totals.unitsLeased) {
                                $scope.totals.leased = 0
                            } else {
                                $scope.totals.leased = Math.round(($scope.totals.leased || 0) / $scope.totals.unitsLeased * 10) / 10;
                            }

                            if (!$scope.totals.unitsAtr) {
                                $scope.totals.atr_percent = 0
                            } else {
                                $scope.totals.atr_percent = Math.round(($scope.totals.atr_percent || 0) / $scope.totals.unitsAtr * 10) / 10;
                            }

                            if (!$scope.totals.unitsRenewal) {
                                $scope.totals.renewal = 0
                            } else {
                                $scope.totals.renewal = Math.round(($scope.totals.renewal || 0) / $scope.totals.unitsRenewal * 10) / 10;
                            }

                            $scope.totals.weeklytraffic = ($scope.totals.weeklytraffic || 0) / $scope.totals.units;
                            $scope.totals.weeklyleases = ($scope.totals.weeklyleases || 0) / $scope.totals.units;
                            $scope.totals.unitPercent = 100;
                            $scope.totals.rent = ($scope.totals.rent || 0) / $scope.totals.units;
                            $scope.totals.mersqft = ($scope.totals.rent || 0) / $scope.totals.sqft;
                            $scope.totals.concessions = ($scope.totals.concessions || 0) / $scope.totals.units;
                            $scope.totals.ner = ($scope.totals.ner || 0) / $scope.totals.units;
                            $scope.totals.nersqft = ($scope.totals.ner || 0) / $scope.totals.sqft;
                            $scope.totals.runrate = ($scope.totals.runrate || 0) / $scope.totals.units;
                            $scope.totals.runratesqft = ($scope.totals.runrate || 0) / $scope.totals.sqft;
                            $scope.totals.units = ($scope.totals.units || 0) / $scope.totalSurveys;

                        }

                    }
                }, true)

                $scope.surveyTooltip = function(comp) {
                    return "Last Survey: " + (comp && comp.survey && comp.survey.date ? moment(comp.survey.date).format("MM/DD/YYYY") : "Never");
                }

                $scope.placement = function(a,b) {
                        return a == b ? "right-bottom" : 'right';
                }

                var trusted = {};
                $scope.getPopoverContent = function(comp) {

                    var content = "This property is also a competitor for: <B>"+  comp.otherSubjects.join(', ') + "</B>";

                    return trusted[content] || (trusted[content] = $sce.trustAsHtml(content));
                }

                $scope.toggleOpen = function(comp) {
                    comp.open = !comp.open;
                }

                $scope.bedroomsLabel = function(i) {

                    switch (parseInt(i)) {
                        case 0:
                            return "Studios";
                        default:
                            return i + " Bedrooms";
                    }
                }

                $scope.toggleSort = function (v) {
                    $gridService.toggle($scope.sort, v, true)

                    var s = $scope.sort[v];

                    if (s == null) {
                        $scope.orderBy = $scope.defaultSort;

                    }
                    else
                    if (s == true) {
                        $scope.orderBy = "-" + v;
                    }
                    else {
                        $scope.orderBy = v;
                    }

                    if (!$scope.skipcookie) {
                        var expireDate = new Date();
                        expireDate.setDate(expireDate.getDate() + 365);
                        $cookies.put('cmp.o', $scope.orderBy, {expires: expireDate})
                    }

                }
            },
            templateUrl: '/components/propertyProfile/propertyComps.html?bust=' + version
        };
    })
