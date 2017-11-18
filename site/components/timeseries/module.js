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
                var temp;

                var extremes = [];
                for(var i in $scope.options.extremes) {
                    extremes[i] = {
                        min: 0,
                        max: 0,
                        foundmin: false,
                        foundmax: false
                    }
                }
                var y;
                chart.series.forEach(function(s) {
                    if (s.visible && name != s.name || !s.visible && name == s.name) {
                        y = s.options.yAxis;
                        temp = _.min(s.processedYData);
                        if (temp < extremes[y].min || !extremes[y].foundmin) {
                            extremes[y].min = temp;
                            extremes[y].foundmin = true;
                        }

                        temp = _.max(s.processedYData);
                        if (temp > extremes[y].max || !extremes[y].foundmax) {
                            extremes[y].max = temp;
                            extremes[y].foundmax = true;
                        }
                    }
                })

                console.log(extremes);

                extremes.forEach(function(ex,i) {
                    chart.yAxis[i].setExtremes(ex.min, ex.max);
                })

            }

            $scope.$watch('options', function(a,b){
                // console.log($scope.options);
                if ($scope.options) {

                    if (!$scope.options.extremes) {
                        $scope.options.extremes = {
                            0: {
                                min: $scope.options.min,
                                max: $scope.options.max,
                                title: $scope.options.title
                            }
                        }
                    }

                    var yAxis = [];

                    var y;
                    for(var i in $scope.options.extremes) {
                        y = {
                            title: {
                                text: $scope.options.extremes[i].title
                            },
                            labels: {
                                formatter: function () {
                                    return $scope.options.prefix + this.value.toFixed($scope.options.decimalPlaces).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + $scope.options.suffix;
                                }
                            }
                        };

                        if (i == 1) {
                            y.opposite = true;
                        }

                        yAxis.push(y);

                    }

                    window.setTimeout(function() {
                        var el = $($element).find('.visible-print-block')
                        var el2 = $($element).find('.hidden-print-block')

                        var data = {
                            chart: {
                                type: 'spline',
                                ignoreHiddenSeries : true,
                                marginLeft: 75 + ($scope.options.additionalMargin || 0), // Keep all charts left aligned
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
                            yAxis: yAxis,
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

                        for(var i in $scope.options.extremes) {
                            chart.highcharts().yAxis[i].setExtremes($scope.options.extremes[i].min, $scope.options.extremes[i].max);
                        }

                        $rootScope.$broadcast('timeseriesLoaded');
                    }, 0);

                }

            });


        },
        templateUrl: '/components/timeseries/timeseries.html?bust=' + version
    };
})

