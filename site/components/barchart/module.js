angular.module("biradix.global").directive("barChart", function() {
    return {
        restrict: "E",
        scope: {
            options: "=",
        },
        controller: function($scope, $element) {
            Highcharts.setOptions({
                global: {
                    useUTC: false,
                },
            });

            $scope.$watch("options", function() {
                if ($scope.options) {
                    window.setTimeout(function() {
                        var el = $($element).find("div");

                        var data = {
                            chart: {
                                type: $scope.options.type || "column",
                            },
                            title: {
                                text: "",
                            },
                            xAxis: {
                                categories: $scope.options.categories,
                                crosshair: true,
                            },
                            yAxis: {
                                min: 0,
                                title: {
                                    text: $scope.options.yLabel,
                                },
                            },
                            tooltip: {
                                headerFormat: "<span style='font-size:10px'>{point.key}</span><table>",
                                pointFormat: "<tr><td style='color:{series.color};padding:0'>{series.name}: </td>" +
                                "<td style='padding:0'><b>{point.y}</b></td></tr>",
                                footerFormat: "</table>",
                                shared: true,
                                useHTML: true,
                            },
                            plotOptions: {
                                column: {
                                    pointPadding: 0.2,
                                    borderWidth: 0,
                                },
                            },
                            credits: {
                                enabled: false,
                            },
                            series: $scope.options.data,
                        };

                        el.highcharts(data);

                        Highcharts.charts.forEach(function(chart) {
                            if (chart && Object.keys(chart).length > 0 && !$("#" + chart.container.id).length) {
                                chart.destroy();
                            }
                        });
                    }, 200);
                }
            });
        },
        templateUrl: "/components/barchart/barchart.html?bust=" + version,
    };
});
