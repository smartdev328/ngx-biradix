angular.module('biradix.global').directive('trendsTimeSeries', function () {
        return {
            restrict: 'E',
            scope: {
                options: '=',
                settings: '=',
                report: '=',
                cbLegendClicked: '&',
                legendUpdated: '=',
                offset: "="
            },
            controller: function ($scope, $element, $reportingService) {


                $scope.$watch('legendUpdated', function (a, b) {

                    if ($scope.legendUpdated) {
                        var el2 = $($element).find('.hidden-print-block')

                        var chart = el2.highcharts();
                        chart.series.forEach(function (s) {

                            if (s.name == $scope.legendUpdated.name && s.visible != $scope.legendUpdated.visible) {

                                $scope.calcExtremes(chart, s.name);

                                if (s.visible) {
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
                            temp = _.min(_.filter(s.processedYData, function(x) {return x != null}));
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

                    if (min == Infinity) {
                        min = 0;
                        max = $scope.options.emptyMaxX;
                    }

                    chart.yAxis[0].setExtremes(min, max);
                }
                $scope.$watch('report', function(a,b){
                    if ($scope.report) {
                        window.setTimeout(function() {
                            var d1 = $reportingService.getDateRangeLabel($scope.settings.daterange1, $scope.offset);
                            var d2 = $reportingService.getDateRangeLabel($scope.settings.daterange2, $scope.offset);

                            $scope.d1 = d1;
                            $scope.d2 = d2;


                            $scope.averages = {
                                day1subject : 0,
                                day1subjectcount : 0,
                                day1averages: 0,
                                day1averagescount : 0,
                                day2subject : 0,
                                day2subjectcount : 0,
                                day2averages: 0,
                                day2averagescount : 0,                                
                            };

                            var singleLineSubjects = $scope.getSingleLineSubjects(d1, d2);
                            var singleLineComps = $scope.getSingleLineComps(d1, d2);
                            var ungroupedSubjects = $scope.getUngroupedSubjects(d1, d2);
                            var allFlooplanSubjects = [];
                            var allFlooplanComps = [];

                            if ($scope.settings.selectedBedroom === -2) {
                                if ($scope.options.metric === 'ner') {
                                    allFlooplanSubjects = $scope.getAllFloorplansSubjects(d1, d2, '');
                                    allFlooplanComps = $scope.getAllFloorplansComps(d1, d2, '');
                                } else if ($scope.options.metric === 'nersqft') {
                                    allFlooplanSubjects = $scope.getAllFloorplansSubjects(d1, d2, '_nersqft');
                                    allFlooplanComps = $scope.getAllFloorplansComps(d1, d2, '_nersqft');
                                }
                            }

                            $scope.calcAverages();

                            var data = [];

                            if (!$scope.settings.groupProperties) {
                                data = data.concat(ungroupedSubjects.d1subjects);
                            } else {
                                if ($scope.settings.selectedBedroom === -2 && ($scope.options.metric === 'ner' || $scope.options.metric === 'nersqft')) {
                                    data = data.concat(allFlooplanSubjects.d1subjects);
                                } else {
                                    data = data.concat([singleLineSubjects.d1subject]);
                                }
                            }

                            if ($scope.settings.showCompAverage) {
                                if ($scope.settings.selectedBedroom === -2 && ($scope.options.metric === 'ner' || $scope.options.metric === 'nersqft')) {
                                    data = data.concat(allFlooplanComps.d1averages);
                                } else {
                                    data = data.concat([singleLineComps.d1comp]);
                                }
                            }

                            if ($scope.settings.daterange2.enabled) {
                                if (!$scope.settings.groupProperties) {
                                    data = data.concat(ungroupedSubjects.d2subjects);
                                } else {
                                    if ($scope.settings.selectedBedroom === -2 && ($scope.options.metric === 'ner' || $scope.options.metric === 'nersqft')) {
                                        data = data.concat(allFlooplanSubjects.d2subjects);
                                    } else {
                                        data = data.concat([singleLineSubjects.d2subject]);
                                    }
                                }
                                if ($scope.settings.showCompAverage) {
                                    if ($scope.settings.showCompAverage) {
                                        if ($scope.settings.selectedBedroom === -2 && ($scope.options.metric === 'ner' || $scope.options.metric === 'nersqft')) {
                                            data = data.concat(allFlooplanComps.d2averages);
                                        } else {
                                            data = data.concat([singleLineComps.d2comp]);
                                        }
                                    }
                                }
                            }
                            $scope.calcMinMax(data);

                            var el = $($element).find('.visible-print-block')
                            var el2 = $($element).find('.hidden-print-block')
                            var container = $("#timeseries-container")

                            var data = {
                                chart: {
                                    type: 'spline',
                                    ignoreHiddenSeries : true,
                                    marginLeft: 65, // Keep all charts left aligned
                                    spacingTop: 20,
                                    spacingBottom: 20
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
                                    text: $scope.options.title + " <i style='color:#888888;font-size:14px;font-weight:bold'> - " + d1 + ($scope.settings.daterange2.enabled ? " vs " + d2 : "</i>"),
                                    align: 'left',
                                    margin: 15,
                                    x: 55,
                                    useHTML: true
                                },
                                // subtitle: {
                                //     text: d1 + ($scope.settings.daterange2.enabled ? " vs " + d2 : ""),
                                //     align: 'left',
                                //     x: 55,
                                //     style: {
                                //         fontStyle: 'italic'
                                //     }
                                // },
                                xAxis: {
                                    crosshair: false,
                                    allowDecimals: false,
                                    categries: [0, 1,2, 3, 4, 5, 6, 7, 8, 9 , 10],
                                    labels: {
                                        formatter: function () {
                                            return "Week: " + (this.value + 1);
                                        }
                                    }
                                },
                                yAxis: {
                                    title: {
                                        text: ""
                                    },
                                    labels: {
                                        formatter: function () {
                                            return $scope.options.prefix + this.value.toFixed($scope.options.decimalPlaces).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + $scope.options.suffix;
                                        }
                                    }
                                },
                                tooltip: {
                                    shared: true,
                                    formatter: function() {
                                        var s = "<span>Week ";

                                        var series = this.points[0].series.chart.series;

                                        var x = this.x;

                                        var y;
                                        var d;
                                        var first = true;
                                        series.forEach(function(p) {
                                            if (p.visible) {
                                                y = _.find(p.data, function (z) {
                                                    return z.x == x
                                                });

                                                if (y) {

                                                    if (first && y.week) {
                                                       s += y.week +"</span><br/>";
                                                       first = false;
                                                    }
                                                    d = moment(y.custom).format("MMM DD, YYYY")
                                                    y = y.y;

                                                    if (y) {
                                                        s += '<span style="color:' + p.color + ';">\u25CF</span> ' + p.name + ' - <i>' + d + '</i>: <b>' + $scope.options.prefix + y.toFixed($scope.options.decimalPlaces).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + $scope.options.suffix + '</b><br/>';
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
                                    layout: 'vertical',
                                    align: 'right',
                                    verticalAlign: 'middle',
                                    borderWidth: 0,
                                },
                                series: data,

                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 800
                                        },
                                        chartOptions: {
                                            legend: {
                                                layout: 'horizontal',
                                                align: 'left',
                                                verticalAlign: 'bottom'
                                            }
                                        }
                                    }]
                                }
                            };

                            if (!$scope.settings.tableView) {
                                var chart;
                                if (phantom) {
                                    chart = el.highcharts(data);
                                }
                                else {
                                    chart = el2.highcharts(data);
                                    container.bind('mouseout', function (e) {

                                        var chart,
                                            point,
                                            i,
                                            j
                                        ;

                                        for (i = 0; i < Highcharts.charts.length; i = i + 1) {
                                            chart = Highcharts.charts[i];


                                            if (chart && chart.pointer) {

                                                for (j = 0; j <= 3; j++) {
                                                    if (chart.series.length > j) {
                                                        chart.series[j].points.forEach(function (point) {
                                                            if (point.state == 'hover') {
                                                                point.series.chart.tooltip.hide();
                                                                point.onMouseOut();

                                                            }
                                                        });

                                                    }
                                                }
                                            }
                                        }
                                    });
                                    container.bind('mousemove touchmove touchstart', function (e) {
                                        var chart,
                                            point,
                                            i,
                                            j,
                                            event;

                                        var points = [];


                                        var clientX = 0;

                                        for (i = 0; i < Highcharts.charts.length; i = i + 1) {
                                            chart = Highcharts.charts[i];

                                            // if (chart) {
                                            //     chart.xAxis[0].update({
                                            //         crosshair: true
                                            //     });
                                            // }

                                            if (chart && chart.pointer) {
                                                event = chart.pointer.normalize(e.originalEvent); // Find coordinates within the chart

                                                // console.log(event);
                                                clientX = event.clientX;
                                                point = null;
                                                for (j = 0; j <= 3; j++) {
                                                    if (chart.series.length > j) {
                                                        point = chart.series[j].searchPoint(event, true); // Get the hovered point
                                                        if (point) {
                                                            points.push({i: i, x: point.x, point: point})
                                                        }

                                                    }
                                                }
                                            }
                                        }

                                        var min = 999
                                        var mindist = 99999;

                                        points.forEach(function (p) {
                                            // console.log(p.point.clientX - clientX);
                                            if (Math.abs(p.point.clientX - clientX) < mindist) {
                                                mindist = Math.abs(p.point.clientX - clientX);
                                                min = p.x;
                                            }
                                        })

                                        //console.log(min);
                                        //console.log(points);

                                        if (min < 999) {
                                            var found = {};
                                            points.forEach(function (p) {
                                                if (p.x == min && !found[p.i]) {
                                                    //console.log(p);
                                                    p.point.onMouseOver();
                                                    found[p.i] = true;
                                                }
                                            })
                                        }

                                    });
                                }

                                Highcharts.charts.forEach(function (chart) {
                                    if (chart && !$("#" + chart.container.id).length) {
                                        chart.destroy();
                                    }

                                    if (chart && chart.pointer) {
                                        chart.pointer.reset = function () {
                                            return undefined
                                        };
                                    }

                                })

                                $scope.calcExtremes(chart.highcharts());
                            }

                            $scope.trendsTable = '/components/reports/trendsTable.html?bust=' + version;

                        }, 0);

                    }

                });

                $scope.calcAverages = function() {
                    if ($scope.averages.day1subjectcount > 0) {
                        $scope.averages.day1subject /= $scope.averages.day1subjectcount;
                    }

                    if ($scope.averages.day1averagescount > 0) {
                        $scope.averages.day1averages /= $scope.averages.day1averagescount;
                    }

                    if ($scope.averages.day2subjectcount > 0) {
                        $scope.averages.day2subject /= $scope.averages.day2subjectcount;
                    }

                    if ($scope.averages.day2averagescount > 0) {
                        $scope.averages.day2averages /= $scope.averages.day2averagescount;
                    }
                }
                $scope.calcMinMax = function(lines) {
                    lines.forEach(function(line) {
                        line.data.forEach(function(point) {
                            if (point && typeof point.y !== "undefined" && point.y < $scope.options.min) {
                                $scope.options.min = point.y;
                            }

                            if (point && typeof point.y !== "undefined" && point.y > $scope.options.max) {
                                $scope.options.max = point.y;
                            }
                        });
                    });
                };

                $scope.getBedroomsSuffix = function() {
                    var suffix = "";

                    switch($scope.options.metric) {
                        case "ner":
                        case "nersqft":
                        case "rent":
                        case "rentsqft":
                        case "runrate":
                        case "runratesqft":
                        case "concessions":
                            if ($scope.settings.selectedBedroom === -1) {
                                suffix = "";
                            } else if ($scope.settings.selectedBedroom !== -2) {
                                suffix = ": " + $scope.settings.selectedBedroom + " Bdrs.";
                            }
                            break;
                    }
                    return suffix;
                }

                $scope.getSingleLineComps = function(d1, d2) {
                    var suffix = $scope.getBedroomsSuffix();

                    var d1scomps = {name: 'Comps' + suffix, data:[], color: "#434348"};
                    var d2scomps = {name: "(Previous) " + 'Comps' + suffix, data:[],dashStyle: 'shortdash', color: "#434348"};

                    $scope.report.points.forEach(function(d,i) {
                        if (typeof d.points[$scope.options.metric].day1averages != 'undefined') {
                            d1scomps.data.push({x:i,y: Math.round(d.points[$scope.options.metric].day1averages * 100) / 100, custom: d.day1date, week: d.w});
                            $scope.averages.day1averagescount++;
                            $scope.averages.day1averages+=d.points[$scope.options.metric].day1averages;
                        }
                        if (typeof d.points[$scope.options.metric].day2averages != 'undefined') {
                            d2scomps.data.push({x:i,y: Math.round(d.points[$scope.options.metric].day2averages * 100) / 100, custom: d.day2date, week: d.w});
                            $scope.averages.day2averagescount++;
                            $scope.averages.day2averages+=d.points[$scope.options.metric].day2averages;
                        }
                    });
                    return {d1comp: d1scomps, d2comp: d2scomps};
                };

                $scope.getSingleLineSubjects = function(d1, d2) {
                    var suffix = $scope.getBedroomsSuffix();

                    var d1subject = {name: "Your Properties"+ suffix, data:[], color: '#7CB5EC'};
                    var d2subject = {name: "(Previous) " + "Your Properties"+ suffix, data:[],dashStyle: 'shortdash', color: '#7CB5EC'};

                    $scope.report.points.forEach(function(d,i) {
                        if (typeof d.points[$scope.options.metric].day1subject != 'undefined') {
                            d1subject.data.push({x:i,y: Math.round(d.points[$scope.options.metric].day1subject * 100) / 100, custom: d.day1date, week: d.w});
                            $scope.averages.day1subjectcount++;
                            $scope.averages.day1subject+=d.points[$scope.options.metric].day1subject;
                        }

                        if (typeof d.points[$scope.options.metric].day2subject != 'undefined') {
                            d2subject.data.push({x:i,y: Math.round(d.points[$scope.options.metric].day2subject * 100) / 100, custom: d.day2date, week: d.w});
                            $scope.averages.day2subjectcount++;
                            $scope.averages.day2subject+=d.points[$scope.options.metric].day2subject;
                        }
                    });
                    return {d1subject: d1subject, d2subject: d2subject}
                };

                $scope.getAllFloorplansSubjects = function(d1, d2, suffix) {
                    var d1subjects = [];
                    var d2subjects = [];
                    var d1subject;
                    var d2subject;
                    $scope.report.points.forEach(function(d,i) {
                        for (var b in $scope.report.bedrooms) {
                            d1subject = d1subjects.find(function(s) {
                                return s.b === b;
                            });

                            if (!d1subject) {
                                d1subject = {name: "Your Properties: " + b + " Bdrs.", data:[], color: '', b: b};
                                d1subjects.push(d1subject);
                            }

                            d2subject = d2subjects.find(function(s) {
                                return s.b === b;
                            });

                            if (!d2subject) {
                                d2subject = {name: "(Previous) " + "Your Properties: " + b + " Bdrs.", data:[], color: '', dashStyle: 'shortdash', b: b};
                                d2subjects.push(d2subject);
                            }

                            if (d.points[b + suffix] && typeof d.points[b + suffix].day1subject != 'undefined') {
                                d1subject.data.push({x:i,y: Math.round(d.points[b + suffix].day1subject * 100) / 100, custom: d.day1date, week: d.w});
                                $scope.averages.day1subjectcount++;
                                $scope.averages.day1subject+=d.points[b + suffix].day1subject;
                            }

                            if (d.points[b + suffix] && typeof d.points[b + suffix].day2subject != 'undefined') {
                                d2subject.data.push({x:i,y: Math.round(d.points[b + suffix].day2subject * 100) / 100, custom: d.day2date, week: d.w});
                                $scope.averages.day2subjectcount++;
                                $scope.averages.day2subject+=d.points[b + suffix].day2subject;
                            }
                        }
                    });

                    return {d1subjects: d1subjects, d2subjects: d2subjects}
                };

                $scope.getAllFloorplansComps = function(d1, d2, suffix) {
                    var d1averages = [];
                    var d2averages = [];
                    var d1average;
                    var d2average;
                    $scope.report.points.forEach(function(d,i) {
                        for (var b in $scope.report.bedrooms) {
                            d1average = d1averages.find(function(s) {
                                return s.b === b;
                            });

                            if (!d1average) {
                                d1average = {name: "Your Comps: " + b + " Bdrs.", data:[], color: '', b: b};
                                d1averages.push(d1average);
                            }

                            d2average = d2averages.find(function(s) {
                                return s.b === b;
                            });

                            if (!d2average) {
                                d2average = {name: "(Previous) " + "Your Comps: " + b + " Bdrs.", data:[], color: '', dashStyle: 'shortdash', b: b};
                                d2averages.push(d2average);
                            }

                            if (d.points[b + suffix] && typeof d.points[b + suffix].day1averages != 'undefined') {
                                d1average.data.push({x:i,y: Math.round(d.points[b + suffix].day1averages * 100) / 100, custom: d.day1date, week: d.w});
                                $scope.averages.day1averagescount++;
                                $scope.averages.day1averages+=d.points[b + suffix].day1averages;
                            }

                            if (d.points[b + suffix] && typeof d.points[b + suffix].day2averages != 'undefined') {
                                d2average.data.push({x:i,y: Math.round(d.points[b + suffix].day2averages * 100) / 100, custom: d.day2date, week: d.w});
                                $scope.averages.day2averagescount++;
                                $scope.averages.day2averages +=d.points[b + suffix].day2averages;
                            }
                        }
                    });

                    return {d1averages: d1averages, d2averages: d2averages}
                };
                
                $scope.getUngroupedSubjects = function(d1, d2) {
                    var d1subjects = [];
                    var d2subjects = [];
                    var d1subject;
                    var d2subject;
                    var subject;
                    var suffix = $scope.getBedroomsSuffix();
                    $scope.report.points.forEach(function(d,i) {
                        for (var subjectId in d.points[$scope.options.metric].subjects) {
                            subject = d.points[$scope.options.metric].subjects[subjectId];
                            d1subject = d1subjects.find(function(s) {
                                return s.propertyId.toString() === subjectId.toString()
                            });

                            if (!d1subject) {
                                d1subject = {name: subject.name + suffix, data:[], color: '', propertyId: subjectId.toString()};
                                d1subjects.push(d1subject);
                            }

                            d2subject = d2subjects.find(function(s) {
                                return s.propertyId.toString() === subjectId.toString()
                            });

                            if (!d2subject) {
                                d2subject = {name: "(Previous) " + subject.name + suffix, data:[], color: '', dashStyle: 'shortdash', propertyId: subjectId.toString()};
                                d2subjects.push(d2subject);
                            }

                                if (typeof subject.day1subject != 'undefined') {
                                    d1subject.data.push({x:i,y: Math.round(subject.day1subject * 100) / 100, custom: d.day1date, week: d.w});
                                    $scope.averages.day1subjectcount++;
                                    $scope.averages.day1subject+=subject.day1subject;
                                }

                                if (typeof subject.day2subject != 'undefined') {
                                    d2subject.data.push({x:i,y: Math.round(subject.day2subject * 100) / 100, custom: d.day2date, week: d.w});
                                    $scope.averages.day2subjectcount++;
                                    $scope.averages.day2subject+=subject.day2subject;
                                }
                        }
                    });
                    var colors = ['#7CB5EC', '#90ed7d', '#f7a35c', '#8085e9', '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#A47D7C', '#B5CA92'];
                    d1subjects.forEach(function(e,i){
                        e.color = colors[i];
                    });
                    d2subjects.forEach(function(e,i){
                        e.color = colors[i];
                    });
                    return {d1subjects: d1subjects, d2subjects: d2subjects}
                }
            },
            template:
                "{{debug}}<div ng-if='!settings.tableView' ng-style=\"{'height': options.height + 'px', 'width': options.printWidth + 'px'}\" class=\"visible-print-block\"></div>"+
                "<div ng-if='!settings.tableView' ng-style=\"{'height': options.height + 'px'}\" class=\"hidden-print-block\"></div>" +
                "<div ng-if='settings.tableView' ng-include=\"trendsTable\"></div>"
        };
    })

