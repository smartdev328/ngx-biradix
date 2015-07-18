'use strict';
define([
    'app',
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
            controller: function ($scope) {
                $scope.rankings = {}

                $scope.report = _.sortByAll($scope.report, ['bedrooms', 'bathrooms'])
                $scope.report.forEach(function(fp) {
                    $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms] = $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms] || {};

                    $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].floorplans = $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].floorplans || [];

                    var f = {description: fp.description, units : fp.units, sqft: fp.sqft, ner: fp.ner, nersqft: fp.nersqft};


                    if ($scope.subject._id == fp.id) {
                        f.name = $scope.subject.name;
                    } else {
                        f.name = _.find($scope.comps, function(x) {
                            return x.id == fp.id}).name;
                    }

                    $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].floorplans.push(f);

                    $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary = $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary || {};

                    $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.units = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.units || 0) + fp.units;

                    $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalsqft = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalsqft || 0) + fp.units * fp.sqft;

                    $scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalner = ($scope.rankings[fp.bedrooms + 'x' + fp.bathrooms].summary.totalner || 0) + fp.units * fp.ner;
                })

                for (var fp in $scope.rankings) {
                    $scope.rankings[fp].summary.sqft = $scope.rankings[fp].summary.totalsqft / $scope.rankings[fp].summary.units;
                    $scope.rankings[fp].summary.ner = $scope.rankings[fp].summary.totalner / $scope.rankings[fp].summary.units;
                }

            },
            templateUrl: '/components/reports/rankings.html'
        };
    })

})
