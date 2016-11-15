'use strict';
define([
    'app',
    '../../services/gridService',
], function (app) {
    app.directive('propertyComps', function () {
        return {
            restrict: 'E',
            scope: {
                comps: '=',
                orderBy: '=',
                show: '=',
                canSurvey: '=',
                roles: '=',
                showTotals:'='
            },
            controller: function ($scope, $gridService, $cookies, $sce) {
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

                        $scope.totals = {units : 0};
                        $scope.totalUnits = 0;

                        $scope.comps.forEach(function(comp, i) {
                            comp.number = i;
                            comp.units = comp.totalUnits;
                            comp.unitPercent = 100;
                            comp.sqft = comp.survey.sqft == null ? -1 : comp.survey.sqft;
                            comp.rent = comp.survey.rent == null ? -1 : comp.survey.rent;
                            comp.mersqft = comp.survey.mersqft == null ? -1 : comp.survey.mersqft;
                            comp.concessions = comp.survey.concessions == null ? -1 : comp.survey.concessions;
                            comp.ner = comp.survey.ner == null ? -1 : comp.survey.ner;
                            comp.nersqft = comp.survey.nersqft == null ? -1 : comp.survey.nersqft;
                            comp.occupancy = comp.survey.occupancy == null ? -1 : comp.survey.occupancy;
                            comp.leased = comp.survey.leased == null ? -1 : comp.survey.leased;
                            comp.renewal = comp.survey.leased == null ? -1 : comp.survey.leased;
                            comp.weeklytraffic = comp.survey.weeklytraffic == null ? -1 : comp.survey.weeklytraffic;
                            comp.weeklyleases = comp.survey.weeklyleases == null ? -1 : comp.survey.weeklyleases;

                            if (comp.survey && comp.survey.rent) {
                                $scope.totalUnits += comp.units;
                                $scope.totals.units = ($scope.totals.units || 0) +  comp.units * comp.units;
                                $scope.totals.sqft = ($scope.totals.sqft || 0) +  comp.survey.sqft * comp.units;
                                $scope.totals.occupancy = ($scope.totals.occupancy || 0) +  comp.survey.occupancy * comp.units;
                                $scope.totals.leased = ($scope.totals.leased || 0) +  comp.survey.leased * comp.units;
                                $scope.totals.renewal = ($scope.totals.renewal || 0) +  comp.survey.renewal * comp.units;
                                $scope.totals.weeklytraffic = ($scope.totals.weeklytraffic || 0)+  comp.survey.weeklytraffic * comp.units;
                                $scope.totals.weeklyleases = ($scope.totals.weeklyleases || 0)+  comp.survey.weeklyleases * comp.units;

                                $scope.totals.rent = ($scope.totals.rent || 0)+  comp.survey.rent * comp.units;
                                $scope.totals.mersqft = ($scope.totals.mersqft || 0)+  comp.survey.mersqft * comp.units;
                                $scope.totals.concessions = ($scope.totals.concessions || 0)+  comp.survey.concessions * comp.units;
                                $scope.totals.ner = ($scope.totals.ner || 0)+  comp.survey.ner * comp.units;
                                $scope.totals.nersqft = ($scope.totals.nersqft || 0)+  comp.survey.nersqft * comp.units;
                            }

                            comp.survey.floorplans.forEach(function(fp,i) {
                                fp.number = i;
                                fp.unitPercent = fp.units / comp.totalUnits * 100;

                                if (typeof fp.description == "undefined" || fp.description === "" || fp.description == null) {
                                    fp.name = fp.bedrooms + "x" + fp.bathrooms;
                                } else {
                                    fp.name = fp.bedrooms + "x" + fp.bathrooms + " " + fp.description;
                                }

                            })

                            var j = 0;
                            comp.bedrooms = [];
                            for (var b in comp.survey.bedrooms) {
                                comp.survey.bedrooms[b].bedrooms = b;
                                comp.survey.bedrooms[b].name = $scope.bedroomsLabel(b);
                                comp.survey.bedrooms[b].number = j;
                                comp.survey.bedrooms[b].units = comp.survey.bedrooms[b].totUnits;
                                comp.survey.bedrooms[b].unitPercent = comp.survey.bedrooms[b].units / comp.totalUnits * 100;
                                j++;
                                comp.bedrooms[b] = comp.survey.bedrooms[b];
                            }


                        })
                        
                        if ($scope.totalUnits > 0) {
                            $scope.totals.units = ($scope.totals.units || 0) / $scope.totalUnits;
                            $scope.totals.sqft = ($scope.totals.sqft || 0) / $scope.totalUnits;
                            $scope.totals.occupancy = ($scope.totals.occupancy || 0) / $scope.totalUnits;
                            $scope.totals.leased = ($scope.totals.leased || 0) / $scope.totalUnits;
                            $scope.totals.renewal = ($scope.totals.renewal || 0) / $scope.totalUnits;
                            $scope.totals.weeklytraffic = ($scope.totals.weeklytraffic || 0) / $scope.totalUnits;
                            $scope.totals.weeklyleases = ($scope.totals.weeklyleases || 0) / $scope.totalUnits;
                            $scope.totals.unitPercent = 100;

                            $scope.totals.rent = ($scope.totals.rent || 0) / $scope.totalUnits;
                            $scope.totals.mersqft = ($scope.totals.mersqft || 0) / $scope.totalUnits;
                            $scope.totals.concessions = ($scope.totals.concessions || 0) / $scope.totalUnits;
                            $scope.totals.ner = ($scope.totals.ner || 0) / $scope.totalUnits;
                            $scope.totals.nersqft = ($scope.totals.nersqft || 0) / $scope.totalUnits;


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

                $scope.marketSurvey = function (compid) {
                    $scope.$root.marketSurvey(compid)
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

                    var expireDate = new Date();
                    expireDate.setDate(expireDate.getDate() + 365);
                    $cookies.put('cmp.o', $scope.orderBy, {expires : expireDate})

                }
            },
            templateUrl: '/components/propertyProfile/propertyComps.html?bust=' + version
        };
    })
})
