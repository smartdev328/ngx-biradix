angular.module('biradix.global').directive('rankingsReport', function () {
        return {
            restrict: 'E',
            scope: {
                subject: '=',
                comps: '=',
                report: '=',
                settings: '=',
                orderBy: '=',
                show: '='
            },
            controller: function ($scope,$gridService,$element) {
                $scope.excludedPopups = {};

                $scope.$watch("orderBy", function() {
                    var v = $scope.orderBy;

                    var dir = v[0] == '-';
                    v = v.replace("-","");

                    $scope.sort = {};
                    $scope.sort[v] = dir;

                    // $scope.debug = {
                    //     o: $scope.orderBy,
                    //     s: $scope.sort
                    // }
                }, true);

                $scope.defaultSort = "nersqft";

                $scope.reload = function() {
                    // window.setTimeout(function() {
                    //     var el = $($element).find('.break');
                    //     var height = el.height();
                    //
                    //     if (height >= 1500 && height <= 1700) {
                    //         el.height(el.height() + 5);
                    //     }
                    // },100)
                }

                $scope.reload();

                $scope.$on('data.reload', function(event, args) {
                    $scope.reload();
                });

                $scope.toggleSort = function (v) {
                    $gridService.toggle($scope.sort, v, true)

                    var s = $scope.sort[v];

                    if (s == null) {
                        $scope.sort = {nersqft:false}
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

            },
            templateUrl: '/components/reports/rankings.html?bust=' + version
        };
    })
