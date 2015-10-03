'use strict';
define([
    'app',
], function (app) {
    app.directive('propertyComps', function () {
        return {
            restrict: 'E',
            scope: {
                comps: '=',
            },
            controller: function ($scope) {
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
            },
            templateUrl: '/components/propertyProfile/propertyComps.html?bust=' + version
        };
    })
})
