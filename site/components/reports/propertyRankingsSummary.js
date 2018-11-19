angular.module('biradix.global').directive('rankingsReportSummary', function () {
        return {
            restrict: 'E',
            scope: {
                subject: '=',
                comps: '=',
                report: '=',
                settings: '=',
                orderBy: '=',
                show:'='
            },
            controller: function ($scope,$gridService,$element) {


                $scope.$watch("orderBy", function() {
                    var v = $scope.orderBy;

                    var dir = v[0] === "-";
                    v = v.replace("-", "");

                    $scope.sort = {};
                    $scope.sort[v] = dir;

                    // $scope.debug = {
                    //     o: $scope.orderBy,
                    //     s: $scope.sort
                    // }
                }, true);

                $scope.defaultSort = "nersqft";

                $scope.reload = function() {
                    // console.log($scope.report);
                    // Phantom JS hack. if the report fits the page exactly, add more pixesl so it doesnt leave a blank logo on the previous page
                    if (phantom) {
                        window.setTimeout(function() {
                            var el = $($element).find('.break');
                            var height = el.height();
                            // $scope.debug = height;

                            if (height >= 1580 && height <= 1660) {
                                el.height(1660);
                            }
                        }, 50)
                    }

                }

                $scope.reload();

                $scope.$on('data.reload', function(event, args) {
                    $scope.reload();
                });

                $scope.toggleSort = function (v) {
                    $gridService.toggle($scope.sort, v, true)

                    var s = $scope.sort[v];

                    if (s == null) {
                        $scope.sort = {nersqft: false}
                        $scope.orderBy = $scope.defaultSort;
                        return;
                    }

                    if (s == true) {
                        $scope.orderBy = "-" + v;
                    }
                    else {
                        $scope.orderBy = v;
                    }
                }

                $scope.bedroomsLabel = function(i) {

                    switch (parseInt(i)) {
                        case 0:
                            return "Studios";
                        default:
                            return i + " Bedrooms";
                    }
                };
            },
            templateUrl: '/components/reports/rankingsSummary.html?bust=' + version
        };
    });
