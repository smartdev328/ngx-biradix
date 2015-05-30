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
            controller: function ($scope) {
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
                    });
                }

                $scope.all = function (state) {

                    var list;
                    if (state) {
                        list = $scope.filtered;
                    } else {
                        list = $scope.items;
                    }

                    list.forEach(function (x) {
                        x.selected = state;
                    })
                }

                $scope.output = function () {
                    var sel = _.filter($scope.items, function (x) {
                        return x.selected == true;
                    })

                    if (!sel || sel.length == 0) {
                        return "None"
                    }

                    if (sel.length == 1) {
                        return sel[0].name;
                    }

                    return sel.length + " selected";

                }
            },
            templateUrl: '/components/filterlist/filterlist.html'
        };
    })
})
