'use strict';
define([
    'app',
    'css!/components/filterlist/filterlist.css'
    ], function (app) {
    app.directive('filterPanel', function () {
        return {
            restrict: 'E',
            scope: {
                options: '=',
                groups: '=',
                moveChecked: '&',
            },
            controller: function ($scope) {
                $scope.version = version;
                $scope.clickCounter = 0;

                $scope.clk = function($event, item) {
                    if ($event.ctrlKey) {
                        item.checked = item.checked === true ? false : true;
                    } else {
                        $scope.resetChecked();
                        item.checked = true;

                        $scope.clickCounter ++;

                        if ($scope.clickCounter % 2 == 0) {
                            $scope.moveChecked();
                        } else {
                            window.setTimeout(function() {
                                $scope.clickCounter = 0;
                            }, 500);
                        }
                    }

                }

                $scope.resetChecked = function() {
                    for(var group in $scope.groups) {
                        $scope.groups[group].forEach(function (item) {
                            item.checked = false;
                            item.focused = false;
                        })
                    }
                }
            },
            templateUrl: '/components/filterlist/filterpanel.html?bust=' + version
        }
    });

    app.directive('filterList', function () {
        return {
            restrict: 'E',
            scope: {
                options: '=',
                items:'='
            },
            controller: function ($scope, $filter, $element) {
                $scope.version = version;

                $scope.filters = {checkAll : true, lstfilter: ""}

                $scope.search = function() {
                    var filtered;
                    if ($scope.filters.lstfilter) {
                        filtered = $filter('filter')($scope.items, $scope.filters.lstfilter)

                    }
                    else {
                        filtered = $scope.items;
                    }

                    $scope.groups = _.groupBy(filtered, function(i) {return i['group']})
                    $scope.groupsAvailable = _.groupBy(_.filter(filtered, function(x) {return x.selected == false}), function(i) {return i['group']})
                    $scope.groupsSelected = _.groupBy(_.filter($scope.items, function(x) {return x.selected == true}), function(i) {return i['group']})

                }

                $scope.$watch('filters.lstfilter', function() {
                    $scope.search();
                }, true);

                $scope.$watch('items', function() {

                    if ($scope.options) {
                        $scope.search();

                        //if ($scope.items) {
                        //    $scope.items.forEach(function (i) {
                        //        if (!i.selected) {
                        //            $scope.filters.checkAll = false;
                        //        }
                        //    });
                        //}
                    }
                }, true);

                //$scope.timer = 0;
                //$scope.selectAll = false;
                //$scope.focused = null;
                //
                //
                //$scope.keydown = function($event) {
                //
                //    console.log($event);
                //    //console.log($scope.focused);
                //
                //    if (!$scope.focused) {
                //        return;
                //    }
                //
                //    //Down Arrow
                //    if ($event.keyCode == 40) {
                //        var found = false;
                //        var done = false;
                //        $scope.items.forEach(function(item) {
                //
                //            if (!done) {
                //                if (item.id == $scope.focused.id) {
                //                    found = true;
                //                }
                //                else if (found && !item.selected) {
                //                    $scope.focused = item;
                //
                //                    if ($event.shiftKey == true) {
                //                        item.checked = true;
                //                    }
                //                    done = true;
                //                }
                //            }
                //        })
                //    }
                //    else
                //    //up arrow
                //    if ($event.keyCode == 38) {
                //        var found = false;
                //        var done = false;
                //
                //        for(var i = $scope.items.length - 1; i >= 0; i--) {
                //            var item = $scope.items[i];
                //            if (!done) {
                //                if (item.id == $scope.focused.id) {
                //                    found = true;
                //                }
                //                else if (found && !item.selected) {
                //                    $scope.focused = item;
                //                    done = true;
                //                }
                //            }
                //        }
                //
                //    }
                //    else
                //    if ($event.keyCode == 32) {
                //        $scope.clk2($scope.focused.id,true);
                //        $scope.timer = 0;
                //    }
                //    else
                //    if ($event.keyCode == 65 && $event.ctrlKey === true) {
                //        //dont highlight the entire screen but allow other cntrl key combinations
                //        $event.preventDefault();
                //    }
                //}
                //
                //$scope.keyup = function($event) {
                //
                //    //Ctrl-A
                //    if ($event.keyCode == 65 && $event.ctrlKey === true) {
                //        $event.preventDefault();
                //        $scope.items.forEach(function(item) {
                //            if (!item.selected) {
                //                item.checked = !$scope.selectAll;
                //            }
                //        })
                //
                //        $scope.selectAll = !$scope.selectAll;
                //    }
                //}

                $scope.moveChecked = function (state) {
                    $scope.resetFocused();

                    $scope.items.forEach(function (item) {

                        if (item.selected === state && item.checked) {
                            item.selected = !state;
                            item.focused = true;
                        }
                    });

                    $scope.resetChecked();

                }

                $scope.resetChecked = function() {
                    $scope.items.forEach(function(item) {
                        item.checked = false;
                    })
                }

                $scope.resetFocused = function() {
                    $scope.items.forEach(function(item) {
                        item.focused = false;
                    })

                }

                $scope.all = function (state) {
                    $scope.resetFocused();
                    var list;
                    if (state) {
                        list = $filter('filter')($scope.items, $scope.filters.lstfilter)
                    } else {
                        list = $scope.items;
                    }

                    list.forEach(function (x) {
                        x.selected = state;
                        x.focused = true;
                    })

                    $scope.resetChecked();
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
