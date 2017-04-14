'use strict';
define([
    'app'
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
                                    },
                                   spline: {
                                        marker: {
                                            enabled: false
                                        }
                                    }
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
                                    xDateFormat: "%b %d, %Y",
                                    formatter: function() {
                                        var s = "<span>" + moment(this.x).format("MMM DD, YYYY") + "</span><br/>";

                                        var series = this.points[0].series.chart.series;
                                        var x = this.x;

                                        var sortedPoints = series.sort(function(a, b){
                                            var ay = _.find(a.data,function(z) {return z.x == x});
                                            var by = _.find(b.data,function(z) {return z.x == x});

                                            if (ay) {
                                                ay = ay.y
                                            } else {
                                                ay = 0;
                                            }

                                            if (by) {
                                                by = by.y
                                            } else {
                                                by = 0;
                                            }
                                            return ((ay > by) ? -1 : ((ay < by) ? 1 : 0));
                                        });

                                        var y;
                                        sortedPoints.forEach(function(p) {
                                            y = _.find(p.data,function(z) {return z.x == x});

                                            if (y) {
                                                y = y.y;
                                                s += '<span style="color:' + p.color + ';">\u25CF</span> ' + p.name + ': <b>' + $scope.options.prefix + y.toFixed($scope.options.decimalPlaces).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + $scope.options.suffix + '</b><br/>';
                                            }

                                        })

                                        return s;

                                    },
                                    // pointFormatter: function() {
                                    //     return '<span style="color:' + this.series.color + ';">\u25CF</span> ' + this.series.name + ': <b>' + $scope.options.prefix + this.y.toFixed($scope.options.decimalPlaces).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + $scope.options.suffix + '</b><br/>';
                                    // }
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
