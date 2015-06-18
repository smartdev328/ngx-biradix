'use strict';
define([
    'app',
    '//code.highcharts.com/highcharts.js'
], function (app) {
    app.directive('timeSeries', function () {
        return {
            restrict: 'E',
            scope: {
                options: '='
            },
            controller: function ($scope, $element) {

                $scope.$watch('options', function(){

                    if ($scope.options) {
                        window.setTimeout(function() {
                            var el = $($element).find('.visible-print-block')
                            var el2 = $($element).find('.hidden-print')

                            var data = {
                                chart: {
                                    type: 'spline',
                                    ignoreHiddenSeries : false
                                },
                                title: {
                                    text: '',
                                },
                                xAxis: {
                                    type: 'datetime'
                                },
                                yAxis: {
                                    title: {
                                        text: $scope.options.title
                                    },
                                    min: $scope.options.min,
                                    max: $scope.options.max
                                },
                                tooltip: {
                                    shared: true,
                                    xDateFormat: "%b %d, %Y"
                                },
                                credits: {
                                    enabled: false
                                },
                                legend: {
                                    layout: 'horizontal',
                                    align: 'left',
                                    verticalAlign: 'bottom',
                                    borderWidth: 0
                                },
                                series: $scope.options.data
                            };
                            el.highcharts(data);
                            el2.highcharts(data);
                        }, 500);

                    }

                });


            },
            templateUrl: '/components/timeseries/timeseries.html'
        };
    })
})
