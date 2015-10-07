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
                show: '='
            },
            controller: function ($scope, $gridService, $cookies) {
                $scope.defaultSort = "number"

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


                $scope.$watch("comps", function() {
                    if ($scope.comps) {

                        $scope.comps.forEach(function(comp, i) {
                            comp.number = i;
                            comp.units = comp.totalUnits;
                            comp.unitPercent = 100;
                            comp.sqft = comp.survey.sqft == null ? -1 : comp.survey.sqft;
                            comp.rent = comp.survey.rent == null ? -1 : comp.survey.rent;
                            comp.concessions = comp.survey.concessions == null ? -1 : comp.survey.concessions;
                            comp.ner = comp.survey.ner == null ? -1 : comp.survey.ner;
                            comp.nersqft = comp.survey.nersqft == null ? -1 : comp.survey.nersqft;

                            comp.survey.floorplans.forEach(function(fp,i) {
                                fp.number = i;
                                fp.unitPercent = fp.units / comp.totalUnits * 100;
                                fp.name = fp.bedrooms + "x" + fp.bathrooms + " " + fp.description;
                            })

                            var j = 0;
                            comp.bedrooms = [];
                            for (var b in comp.survey.bedrooms) {
                                comp.survey.bedrooms[b].name = $scope.bedroomsLabel(b);
                                comp.survey.bedrooms[b].number = j;
                                comp.survey.bedrooms[b].units = comp.survey.bedrooms[b].totUnits;
                                comp.survey.bedrooms[b].unitPercent = comp.survey.bedrooms[b].units / comp.totalUnits * 100;
                                j++;
                                comp.bedrooms[b] = comp.survey.bedrooms[b];
                            }


                        })

                    }
                }, true)

                $scope.surveyTooltip = function(comp) {
                    return "Last update: " + (comp && comp.survey && comp.survey.date ? moment(comp.survey.date).format("MM/DD/YYYY") : "Never");
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
                        return;
                    }

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
