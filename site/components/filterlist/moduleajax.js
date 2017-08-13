angular.module('biradix.global').directive('filterListAjax', function () {
        return {
            restrict: 'E',
            scope: {
                options: '=',
                model:'=',
                search:'='
            },
            controller: function ($scope, $filter, $element) {
                $scope.version = version;
                $scope.filters = {search: ""}

                $scope.output = function () {

                    if (!$scope.model || $scope.model.length == 0) {
                        return $scope.options.noneLabel || "None"
                    }

                    if ($scope.model.length == 1) {
                        return $scope.model[0].name;
                    }

                    return $scope.model.length + " selected";

                }
                $scope.updateSelectedGroups = function() {
                    $scope.groupsSelected = _.groupBy($scope.model, function(i) {return i['group']})
                }

                $scope.updateAvailableGroups = function() {
                    $scope.groupsAvailable = _.groupBy($scope.items, function(i) {return i['group']})
                }

                $scope.hideSelected = function() {

                    _.remove($scope.items, function(x) {return _.find($scope.model, function(y) {return y.id == x.id})})

                    $scope.updateAvailableGroups();
                }

                $scope.$watch("model", function() {
                    $scope.updateSelectedGroups();
                    $scope.hideSelected();
                }, true)


                $scope.performSearch = function() {
                    $scope.search($scope.filters.search, function (items) {
                        $scope.items = [];
                        items.forEach(function (i) {
                            $scope.items.push({id: i._id, name: i.name})
                        })

                        $scope.hideSelected();

                    })
                }

                $scope.performSearch();


            },
            templateUrl: '/components/filterlist/filterlistajax.html?bust=' + version
        };
    })

