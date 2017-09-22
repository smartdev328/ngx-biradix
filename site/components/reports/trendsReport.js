'use strict';
define([
    'app'
], function (app) {
    app.directive('trendsReport', function () {
        return {
            restrict: 'E',
            scope: {
                report: '=',
                settings: '=',
            },
            controller: function ($scope,$element) {

                $scope.options = {height:300, printWidth:800, prefix: '$', suffix: '', decimalPlaces: 0}

                $scope.calcExtremes = function(chart, name) {
                    var min = 0;
                    var max = 0;
                    var temp;
                    var foundmin = false;
                    var foundmax = false;
                    chart.series.forEach(function(s) {
                        if (s.visible && name != s.name || !s.visible && name == s.name) {
                            temp = Math.floor(_.min(_.filter(s.processedYData, function(x) {return x != null})));
                            if (temp < min || !foundmin) {
                                min = temp;
                                foundmin = true;
                            }

                            temp = Math.ceil(_.max(s.processedYData));
                            if (temp > max || !foundmax) {
                                max = temp;
                                foundmax = true;
                            }
                        }
                    })

                    chart.yAxis[0].setExtremes(min, max);
                }
                $scope.$watch('report', function(a,b){
                    if ($scope.report) {
                        window.setTimeout(function() {

                            var d1subject = {name: $scope.report.date1.dashboard.property.name, data:[]};
                            var d1scomps = {name: 'Comp Average', data:[]};

                            var d2subject = {name: $scope.report.date1.dashboard.property.name + ' Compare', data:[],dashStyle: 'longdash'};
                            var d2scomps = {name: 'Comp Average Compare', data:[],dashStyle: 'longdash'};

                            $scope.report.dates.forEach(function(d) {
                                d1subject.data.push(d.day1nersubject ? {y: Math.round(d.day1nersubject * 100) / 100, custom: d.day1date} : null)
                                d1scomps.data.push(d.day1neraverages ? {y: Math.round(d.day1neraverages * 100) / 100, custom: d.day1date} : null)
                                d2subject.data.push(d.day2nersubject ? {y: Math.round(d.day2nersubject * 100) / 100, custom: d.day2date} : null)
                                d2scomps.data.push(d.day2neraverages ? {y: Math.round(d.day2neraverages * 100) / 100, custom: d.day2date} : null)

                            })

                            var data = [d1subject,d1scomps];

                            if ($scope.report.date2) {
                                data.push(d2subject);
                                data.push(d2scomps);
                            }

                            var el = $($element).find('.visible-print-block')
                            var el2 = $($element).find('.hidden-print-block')

                            var data = {
                                chart: {
                                    type: 'spline',
                                    ignoreHiddenSeries : true
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
                                    allowDecimals: false,
                                    categries: [0, 1,2, 3, 4, 5, 6, 7, 8, 9 , 10],
                                    labels: {
                                        formatter: function () {
                                            return 'Week: ' + (this.value + 1);
                                        }
                                    }
                                },
                                yAxis: {
                                    title: {
                                        text: "Net Effective Rent $"
                                    },
                                    // min: $scope.options.min,
                                    // max: $scope.options.max
                                },
                                tooltip: {
                                    shared: true,
                                    formatter: function() {
                                        var s = "<span>Week "+(this.x + 1)+"</span><br/>";

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
                                        var d;
                                        sortedPoints.forEach(function(p) {
                                            if (p.visible) {
                                                y = _.find(p.data, function (z) {
                                                    return z.x == x
                                                });

                                                if (y) {
                                                    d = moment(y.custom).format("MMM DD, YYYY")
                                                    y = y.y;


                                                    if (y) {
                                                        s += '<span style="color:' + p.color + ';">\u25CF</span> ' + p.name + ' (' + d + ') : <b>' + $scope.options.prefix + y.toFixed($scope.options.decimalPlaces).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + $scope.options.suffix + '</b><br/>';
                                                    }
                                                }
                                            }

                                        })

                                        return s;

                                    },
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
                                series: data
                            };

                            var chart;
                            if (phantom) {
                                chart = el.highcharts(data);
                            }
                            else {
                                chart = el2.highcharts(data);
                            }


                        }, 0);

                    }

                });
            },
            templateUrl: '/components/reports/trendsReport.html?bust=' + version
        };
    })

})
