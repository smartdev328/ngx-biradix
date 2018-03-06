angular.module('biradix.global').directive('filterPanel', function () {
        return {
            restrict: 'E',
            scope: {
                options: '=',
                groups: '=',
                moveChecked: '&',
                resetChecked: '&',
            },
            controller: function ($scope) {
                $scope.version = version;
                $scope.clickCounter = 0;
                $scope.selectAll = false;
                $scope.shiftStarted = null;
                $scope.current = null;

                $scope.clk = function($event, item) {
                    if (item.disabled) {
                        return;
                    }

                    $scope.current = item;
                    if ($scope.shiftStarted) {
                        $scope.selectBetween($scope.shiftStarted, item);
                        document.getSelection().removeAllRanges();
                    }
                    else
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

                $scope.selectBetween = function(item1, item2) {
                    $scope.resetChecked();

                    if (item1.id == item2.id) {

                        if (!item1.disabled) {
                            item1.checked = true;
                        }
                        return;
                    }

                    var started = false;
                    var group;
                    for(group in $scope.groups) {
                        $scope.groups[group].forEach(function (item) {
                            if (item.id == item1.id || item.id == item2.id) {
                                started = !started;
                            }

                            if (started || item.id == item1.id || item.id == item2.id) {
                                if (!item1.disabled) {
                                    item.checked = true;
                                }
                            }
                        })
                    }
                }

                $scope.keyup = function($event) {

                    //Shift
                    if ($event.keyCode == 16 && $scope.shiftStarted) {
                        $scope.shiftStarted = null;
                    }
                    else
                    //Ctrl-A
                    if ($event.keyCode == 65 && $event.ctrlKey === true) {
                        $event.preventDefault();
                        $scope.resetChecked();
                        var group;
                        for(group in $scope.groups) {
                            $scope.groups[group].forEach(function (item) {
                                if (!item1.disabled) {
                                    item.checked = true;
                                }
                            })
                        }
                        $scope.selectAll = !$scope.selectAll;
                    }
                }

                $scope.keydown = function($event) {
                    //Shift

                    var group;
                    if ($event.keyCode == 16 && !$scope.shiftStarted) {
                        for(group in $scope.groups) {
                            $scope.groups[group].forEach(function (item) {
                                if (item.checked) {
                                    $scope.shiftStarted = item;
                                }
                            })
                        }
                    }
                    else
                    //Ctrl-A
                    if ($event.keyCode == 65 && $event.ctrlKey === true) {
                        //dont highlight the entire screen but allow other cntrl key combinations
                        $event.preventDefault();
                    }
                    else
                    //Up Arrow
                    if ($event.keyCode == 38) {
                        var prev = $scope.getPrevious($event,1);

                        if (!prev || prev.disabled) {
                            return;
                        }

                        if ($scope.shiftStarted) {
                            $scope.selectBetween($scope.shiftStarted, prev);
                        }
                        else {
                            $scope.resetChecked();
                            if (!prev.disabled) {
                                prev.checked = true;
                            }
                        }
                        $scope.current = prev;
                    }
                    else
                    //Page Up
                    if ($event.keyCode == 33) {
                        var prev = $scope.getPrevious($event,3);

                        if (!prev || prev.disabled) {
                            return;
                        }

                        if ($scope.shiftStarted) {
                            $scope.selectBetween($scope.shiftStarted, prev);
                        }
                        else {
                            $scope.resetChecked();
                            if (!prev.disabled) {
                                prev.checked = true;
                            }
                        }
                        $scope.current = prev;
                    }
                    else
                    //Down Arrow
                    if ($event.keyCode == 40) {
                        var next = $scope.getNext($event,1);

                        if (!next || next.disabled) {
                            return;
                        }

                        if ($scope.shiftStarted) {
                            $scope.selectBetween($scope.shiftStarted, next);
                        }
                        else {
                            $scope.resetChecked();
                            if (!next.disabled) {
                                next.checked = true;
                            }
                        }

                        $scope.current = next;
                    }
                    else
                    //Page Down
                    if ($event.keyCode == 34) {
                        $event.preventDefault();
                        var next = $scope.getNext($event,3);

                        if (!next || next.disabled) {
                            return;
                        }

                        if ($scope.shiftStarted) {
                            $scope.selectBetween($scope.shiftStarted, next);
                        }
                        else {
                            $scope.resetChecked();
                            if (!next.disabled) {
                                next.checked = true;
                            }

                        }

                        $scope.current = next;
                    }

                }

                $scope.getNext = function($event, x) {
                    var j = 0;
                    var found;
                    var response = null;
                    var total = 0;
                    var item;
                    var group;
                    var i;

                    for(group in $scope.groups) {
                        for (i = 0; i < $scope.groups[group].length; i++) {
                            item = $scope.groups[group][i];

                            if (item && $scope.current && item.id == $scope.current.id ) {
                                found = true;
                            }

                            if (found && j <= x) {
                                response = item;
                            }

                            if (j <= x) {
                                total++;
                            }

                            if (found) {
                                j++;
                            }
                        }
                    }

                    if ($event.target.type == 'text') {
                        $event.target = $($event.target).closest("filter-panel");
                    }
                    var formElements = $($event.target).find("input");

                    if (formElements.length >= total && total > 0) {
                        formElements[total-1].focus();
                    }


                    return response;
                }

                $scope.getPrevious = function($event, x) {
                    var j = 0;
                    var found;
                    var response = null;


                    var ar = [];
                    for(var group in $scope.groups) {
                        ar.push(group);
                    }
                    ar.reverse();
                    var total = 0;
                    var item;
                    var i;

                    ar.forEach(function(group) {
                        for (i = $scope.groups[group].length - 1; i >= 0; i--) {
                            item = $scope.groups[group][i];

                            if (item && $scope.current && item.id == $scope.current.id ) {
                                found = true;
                            }


                            if (found && j <= x) {
                                response = item;
                            }

                            if (j <= x) {
                                total++;
                            }

                            if (found) {
                                j++;
                            }
                        }

                    })

                    if ($event.target.type == 'text') {
                        $event.target = $($event.target).closest("filter-panel");
                    }
                    var formElements = $($event.target).find("input");

                    if (formElements.length > 0 && total > 0) {
                        formElements[formElements.length - total].focus();
                    }


                    return response;
                }
            },
            templateUrl: '/components/filterlist/filterpanel.html?bust=' + version
        }
    });

angular.module('biradix.global').directive('filterList', function () {
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

                $scope.$watch("items", function() {
                    if ($scope.options) {
                        $scope.items = _.sortBy($scope.items, function(x) {
                            return (x.group || "") + x.name.toLowerCase();
                        });
                        $scope.search();

                        if ($scope.items) {
                            $scope.items.forEach(function(i) {
                                if (!i.selected) {
                                    $scope.filters.checkAll = false;
                                }
                            });
                        }
                    }
                }, true);

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

