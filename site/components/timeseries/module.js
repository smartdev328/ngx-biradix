angular.module('biradix.global').directive('timeSeries', function () {
    return {
        restrict: 'E',
        scope: {
            options: '=',
            cbLegendClicked: '&',
            legendUpdated: '='
        },
        controller: function ($scope, $element, $rootScope) {

            $scope.$watch('legendUpdated', function(a,b){

                if ($scope.legendUpdated) {
                    var el2 = $($element).find('.hidden-print-block')

                    var chart = el2.highcharts();
                    chart.series.forEach(function(s) {

                        if (s.name == $scope.legendUpdated.name && s.visible != $scope.legendUpdated.visible) {

                            $scope.calcExtremes(chart, s.name);

                            if(s.visible) {
                                s.hide();
                            }
                            else {
                                s.show();
                            }
                        }
                    })

                }
            }, true);

            $scope.calcExtremes = function(chart, name) {
                var min = 0;
                var max = 0;
                var temp;
                var foundmin = false;
                var foundmax = false;
                chart.series.forEach(function(s) {
                    if (s.visible && name != s.name || !s.visible && name == s.name) {
                        temp = _.min(s.processedYData);
                        if (temp < min || !foundmin) {
                            min = temp;
                            foundmin = true;
                        }

                        temp = _.max(s.processedYData);
                        if (temp > max || !foundmax) {
                            max = temp;
                            foundmax = true;
                        }
                    }
                })

                chart.yAxis[0].setExtremes(min, max);
            }

            $scope.$watch('options', function(a,b){
                // console.log($scope.options);
                if ($scope.options) {
                    window.setTimeout(function() {
                        var el = $($element).find('.visible-print-block')
                        var el2 = $($element).find('.hidden-print-block')

                        var data = {
                            chart: {
                                type: 'spline',
                                ignoreHiddenSeries : true,
                                marginLeft: 75, // Keep all charts left aligned
                            },
                            plotOptions: {
                                series: {
                                    animation: !phantom,
                                    events: {
                                        legendItemClick: function () {

                                            var name = this.name;
                                            if ($scope.cbLegendClicked) {

                                                var visible =  !this.visible;
                                                $scope.cbLegendClicked({legend : {name: name, visible: visible}});

                                            }

                                            $scope.calcExtremes(this.chart, name);


                                        }
                                    }
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
                                labels: {
                                    formatter: function () {
                                        return $scope.options.prefix + this.value.toFixed($scope.options.decimalPlaces).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + $scope.options.suffix;
                                    }
                                }
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
                                        if (p.visible) {
                                            y = _.find(p.data, function (z) {
                                                return z.x == x
                                            });

                                            if (y) {
                                                y = y.y;
                                                s += '<span style="color:' + p.color + ';">\u25CF</span> ' + p.name + ': <b>' + $scope.options.prefix + y.toFixed($scope.options.decimalPlaces).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + $scope.options.suffix + '</b><br/>';
                                            }
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

                        var chart;
                         if (phantom) {
                            chart = el.highcharts(data);
                        }
                        else {
                             chart = el2.highcharts(data);
                        }

                        Highcharts.charts.forEach(function(chart) {
                            if (chart && !$("#" + chart.container.id).length) {
                                chart.destroy();
                            }
                        })

                        chart.highcharts().yAxis[0].setExtremes($scope.options.min, $scope.options.max);

                        $rootScope.$broadcast('timeseriesLoaded');
                    }, 0);

                }

            });


        },
        templateUrl: '/components/timeseries/timeseries.html?bust=' + version
    };
})

