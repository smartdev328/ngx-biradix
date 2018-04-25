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
                                type: "category",
                                labels: {
                                    rotation: -45,
                                    style: {
                                        fontSize: "13px",
                                        fontFamily: "Verdana, sans-serif",
                                    },
                                },
                            },
                            yAxis: {
                                min: 0,
                                title: {
                                    text: $scope.options.yLabel,
                                },
                            },
                            tooltip: {
                                enabled: false,
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
                            legend: {
                                enabled: false,
                            },
                            series: $scope.options.data,
                        };

                        data.series[0].dataLabels = {
                            enabled: true,
                                rotation: -90,
                                color: "#FFFFFF",
                                align: "right",
                                format: "{point.y:.0f}", // one decimal
                                y: 10, // 10 pixels down from the top
                                style: {
                                fontSize: "13px",
                                    fontFamily: "Verdana, sans-serif",
                            },
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
