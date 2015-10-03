'use strict';
define([
    'app',
    'highcharts'
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
                            var el2 = $($element).find('.hidden-print-block')

                            var data = {
                                chart: {
                                    type: 'spline',
                                    ignoreHiddenSeries : false
                                },
                                plotOptions: {
                                    series: {
                                        animation: !phantom
                                    }
                                },
                                //plotOptions: {
                                //    spline: {
                                //        marker: {
                                //            enabled: $scope.options.marker
                                //        }
                                //    }
                                //},
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
                                    xDateFormat: "%b %d, %Y",
                                    pointFormatter: function() {
                                        return '<span style="color:' + this.series.color + ';">\u25CF</span> ' + this.series.name + ': <b>' + $scope.options.prefix + this.y.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + $scope.options.suffix + '</b><br/>';
                                    }
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
                        }, 200);

                    }

                });


            },
            templateUrl: '/components/timeseries/timeseries.html?bust=' + version
        };
    })
})
