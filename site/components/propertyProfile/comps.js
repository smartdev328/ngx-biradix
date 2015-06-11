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
                    return "Last update: " + (comp.survey && comp.survey.date ? moment(comp.survey.date).format("MM/DD/YYYY") : "Never");
                }

                $scope.marketSurvey = function (compid) {
                    $scope.$root.marketSurvey(compid)
                }
            },
            templateUrl: '/components/propertyProfile/propertyComps.html'
        };
    })
})
