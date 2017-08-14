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

                $scope.resetChecked = function() {
                    $scope.items.forEach(function(item) {
                        item.checked = false;
                    })

                    $scope.model.forEach(function(item) {
                        item.checked = false;
                    })
                }

                $scope.resetFocused = function() {
                    $scope.items.forEach(function(item) {
                        item.focused = false;
                    })

                    $scope.model.forEach(function(item) {
                        item.focused = false;
                    })
                }

                $scope.moveChecked = function (state) {
                    $scope.resetFocused();

                    var ar;

                    if (!state) {
                        ar = $scope.items
                    } else {
                        ar = $scope.model;
                    }


                    var rem = [];
                    ar.forEach(function (item) {
                        //console.log(item,item.checked,state)
                        if (item.checked) {
                            item.focused = true;
                            rem.push(item.id);

                        }
                    });

                    if (!state) {
                        $scope.model = $scope.model.concat(_.filter(ar, function(x) {return rem.indexOf(x.id) > -1}));
                    } else {
                        $scope.items = $scope.items.concat(_.filter(ar, function(x) {return rem.indexOf(x.id) > -1}));
                    }
                    _.remove(ar, function(x) {return rem.indexOf(x.id) > -1})


                    $scope.resetChecked();
                    $scope.hideSelected();

                }

                $scope.all = function (state) {
                    var ar;

                    if (state) {
                        ar = $scope.items
                    } else {
                        ar = $scope.model;
                    }

                    ar.forEach(function(item) {
                        item.checked = true;
                    })
                    $scope.moveChecked(!state);
                }

            },
            templateUrl: '/components/filterlist/filterlistajax.html?bust=' + version
        };
    })

