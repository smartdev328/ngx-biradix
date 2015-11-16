'use strict';
define([
    'app',
    'css!/components/filterlist/filterlist.css'
    ], function (app) {
    app.directive('filterList', function () {
        return {
            restrict: 'E',
            scope: {
                options: '=',
                items:'='
            },
            controller: function ($scope, $filter, $element) {
                $scope.version = version;

                $scope.filters = {checkAll : true}

                $scope.search = function(s) {
                    if (s) {
                        var filtered = $filter('filter')($scope.items, s.lstfilter)
                        $scope.groups = _.groupBy(filtered, function(i) {return i['group']})
                        return;
                    }
                    $scope.groups = _.groupBy($scope.items, function(i) {return i['group']})

                    $scope.groupsAvailable = _.groupBy(_.filter($scope.items, function(x) {return x.selected == false}), function(i) {return i['group']})
                    $scope.groupsSelected = _.groupBy(_.filter($scope.items, function(x) {return x.selected == true}), function(i) {return i['group']})

                }

                $scope.$watch('items', function() {

                    if ($scope.options) {
                        $scope.search();

                        if ($scope.items) {
                            $scope.items.forEach(function (i) {
                                if (!i.selected) {
                                    $scope.filters.checkAll = false;
                                }
                            });
                        }
                    }
                }, true);

                $scope.timer = 0;
                $scope.ctrl = false;
                $scope.selectAll = false;


                $scope.keydown = function($event) {
                    $event.preventDefault();
                }

                $scope.keyup = function($event) {
                    $event.preventDefault();

                    if ($event.keyCode == 65 && $event.ctrlKey === true) {
                        $scope.items.forEach(function(item) {
                            if (!item.selected) {
                                item.checked = !$scope.selectAll;
                            }
                        })

                        $scope.selectAll = !$scope.selectAll;
                    }
                }


                $scope.clk2 = function(id,state) {
                    var row = _.filter($scope.items, function(x) {return x.id == id});

                    row[0].checked = row[0].checked === true ? false : true;

                    $scope.clk(row,state);


                }

                $scope.single = function(state) {
                    var row = _.filter($scope.items, function(x) {
                        return x.checked == true && x.selected == state});

                    $scope.dbl(row,!state);
                }

                $scope.clk = function(rows,state) {
                    $scope.timer ++;

                    if ($scope.timer % 2 == 0 && rows && rows.length) {
                        $scope.dbl(rows,state);
                    } else {
                        window.setTimeout(function() {
                            $scope.timer = 0;
                        }, 500);
                    }
                }

                $scope.dbl = function (rows, state) {
                    if (!rows || rows.length == 0) {
                        return;
                    }

                    var items = _.filter($scope.items, function (x) {
                        var item2 = _.find(rows, function (y) {
                            return y.id == x.id
                        })

                        if (item2) {
                            return true;
                        } else {
                            return false;
                        }
                    })

                    items.forEach(function (item) {
                        item.selected = state;
                        item.checked = false;
                    });

                }

                $scope.all = function (state) {

                    var elSearch = $($element).find('.search');
                    var search = '';
                    if (elSearch) {
                        search = elSearch.val();
                    }

                    var list;
                    if (state) {
                        list = $filter('filter')($scope.items, search)
                    } else {
                        list = $scope.items;
                    }

                    list.forEach(function (x) {
                        x.selected = state;
                    })

                    $scope.items.forEach(function(item) {
                        item.checked = false;
                    })
                }

                $scope.output = function () {
                    var sel = _.filter($scope.items, function (x) {
                        return x.selected == true;
                    })

                    if (!sel || sel.length == 0) {
                        return $scope.options.noneLabel || "None"
                    }

                    if (sel.length == 1) {
                        return sel[0].name;
                    }

                    return sel.length + " selected";

                }

                //$scope.ie =
                //    /rv:11/.test(window.navigator.userAgent)
                //    || /MSIE/.test(window.navigator.userAgent)
                //    || /Edge/.test(window.navigator.userAgent)

                $scope.small = $(window).width() <= 550 || $scope.ie;

                if (!$scope.ie) {
                    $scope.$on('size', function (e, size) {
                        $scope.small = size <= 550;

                    });
                }
            },
            templateUrl: '/components/filterlist/filterlist.html?bust=' + version
        };
    })
})
