angular.module('biradix.global').directive('filterListAjax', function () {
        return {
            restrict: 'E',
            scope: {
                options: '=',
                model: '=',
                search: '=',
                tooltipfn: "=",
                tooltipdir: "=",
            },
            controller: function ($scope, $filter, $element) {
                console.log($scope.tooltipdir);
                $scope.version = version;
                $scope.filters = {search: "", checkAll : true}

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

                    //console.log($scope.items, $scope.groupsAvailable);
                }

                $scope.hideSelected = function() {

                    _.remove($scope.items, function(x) {return _.find($scope.model, function(y) {return y.id == x.id})})


                    $scope.items = _.sortBy($scope.items, function(x) {return (x.group || '') + x.name.toLowerCase()});
                    $scope.model = _.sortBy($scope.model, function(x) {return (x.group || '') + x.name.toLowerCase()});
                    $scope.updateAvailableGroups();
                }

                $scope.$watch("model", function() {
                    $scope.updateSelectedGroups();
                    $scope.hideSelected();
                }, true)

                $scope.$watch("items", function() {
                    if ($scope.items && $scope.items.length > 0) {
                        $scope.filters.checkAll = false;
                    } else {
                        $scope.filters.checkAll = true;
                    }
                }, true)

                $scope.autocompletedelay = 300;

                $scope.searchChanged = function() {
                    $scope.last = (new Date()).getTime();
                    window.setTimeout($scope.checkSearch, $scope.autocompletedelay);
                }

                $scope.checkSearch = function() {
                    var ms = (new Date()).getTime() - $scope.last;
                    if (ms >= $scope.autocompletedelay) {
                        $scope.performSearch();
                    }
                }

                $scope.performSearch = function() {
                    $scope.search($scope.filters.search, function (items) {
                        $scope.items = [];
                        items.forEach(function(i) {
                            $scope.items.push({id: i._id || i.id, name: i.name, group: i.group, disabled: i.disabled, isCustom: i.isCustom});
                        })

                        $scope.hideSelected();

                    })
                }

                $scope.small = $(window).width() <= 550

                $scope.$on('size', function (e, size) {
                    $scope.small = size <= 550;

                });

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
                        if (item.disabled) {
                            item.checked = false;
                        }
                        else {
                            item.checked = true;
                        }
                    })
                    $scope.moveChecked(!state);
                }



            },
            templateUrl: '/components/filterlist/filterlistajax.html?bust=' + version
        };
    })

