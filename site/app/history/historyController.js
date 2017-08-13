'use strict';
define([
    'app',
], function (app) {

    app.controller('historyController', ['$scope','$rootScope','$location','ngProgress','$dialog','$auditService','toastr','$stateParams','$propertyService', function ($scope,$rootScope,$location,ngProgress,$dialog,$auditService,toastr,$stateParams,$propertyService) {
        window.setTimeout(function() {window.document.title = "Activity History | BI:Radix";},1500)

        $rootScope.nav = "";
        $scope.pager = {offset : 0, currentPage: 1, itemsPerPage: 50}
        $scope.limits = [10,50,100,500]
        $scope.typeOptions = { noneLabel: 'Any', panelWidth:210, minwidth:'100%', hideSearch: false, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Types", labelSelected: "Selected Types", searchLabel: "Types" }
        $scope.userOptions = { noneLabel: 'Any', panelWidth:210, minwidth:'100%', hideSearch: false, dropdown: true, dropdownDirection : 'right', labelAvailable: "Available Users", labelSelected: "Selected Users", searchLabel: "Users" }
        $scope.propertyOptions = { noneLabel: 'Any', panelWidth:210, minwidth:'100%', hideSearch: false, dropdown: true, dropdownDirection : 'right', labelAvailable: "Available Properties", labelSelected: "Selected Properties", searchLabel: "Properties" }
        $scope.daterange={
            direction : "right",
            Ranges : {
                'Today': [moment().startOf("day"), moment().endOf("day")],
                'Week to Date': [moment().startOf("week"), moment().endOf("day")],
                'Month to Date': [moment().startOf("month"), moment().endOf("day")],
                '30 Days': [moment().subtract(30, 'days').startOf("day"), moment().endOf("day")],
                '90 Days': [moment().subtract(90, 'days').startOf("day"), moment().endOf("day")],
                '12 Months': [moment().subtract(1, 'year').startOf("day"), moment().endOf("day")],
                'Year-to-Date': [moment().startOf("year"), moment().endOf("day")],
                'Lifetime': [moment().subtract(30, 'year').startOf("day"), moment().endOf("day")],
            },
            selectedRange : "30 Days",
            selectedStartDate : null,
            selectedEndDate : null
        }

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "History";

        $scope.autocompleteproperties = function(search,callback) {
            $propertyService.search({
                limit: $scope.showInList,
                permission: ['PropertyManage','CompManage'],
                active: true,
                search:search
                , skipAmenities: true
            }).then(function (response) {
                callback(response.data.properties)
            }, function (error) {
                callback([]);
            })

        }

        $scope.reload = function () {
            $scope.localLoading = false;

            var types = _.pluck(_.filter($scope.typeItems,function(x) {return x.selected == true}),"id");
            var users = _.pluck(_.filter($scope.userItems,function(x) {return x.selected == true}),"id");
            var properties = _.pluck($scope.propertyItems,"id");

            $auditService.search({
                skip: $scope.pager.offset, limit: $scope.pager.itemsPerPage
                , types: types
                , users: users
                , properties: properties
                , daterange :
                {
                    daterange: $scope.daterange.selectedRange,
                        start: $scope.daterange.selectedStartDate,
                    end: $scope.daterange.selectedEndDate
                }
                ,offset : moment().utcOffset()
            }).then(function (response) {
                    $scope.activity = response.data.activity;
                    $scope.pager = response.data.pager;
                    $scope.localLoading = true;
                },
                function (error) {
                    if (error.status == 401) {
                        $rootScope.logoff();
                        return;
                    }
                    $scope.localLoading = true;
                });
        }
        var me = $rootScope.$watch("me", function(x) {
            if ($rootScope.me) {
                me();

                $auditService.filters().then(function (response) {
                        $scope.audits = response.data.audits;

                        $scope.typeItems = [];
                        $scope.userItems = [];
                        $scope.propertyItems = [];

                        $scope.audits.forEach(function (a) {
                            $scope.typeItems.push({id: a.key, name: a.value, selected: !a.excludeDefault, group: a.group})
                        })

                        var u,u2;
                        response.data.users.forEach(function (a) {
                            u = {id: a._id, name: a.name, selected: false};
                            if ($rootScope.me.permissions.indexOf('Admin') > -1) {
                                a.roles.forEach(function (r) {
                                    u2 = _.cloneDeep(u);
                                    if (r.name == "Guest") {
                                        u2.group = "Guests";
                                    } else {
                                        u2.group = r.org.name;
                                    }
                                    $scope.userItems.push(u2);
                                })

                            } else {
                                $scope.userItems.push(u)
                            }
                        })

                        $scope.userItems = _.sortBy($scope.userItems, function(x) {return (x.group || '') + x.name});
                        $scope.typeItems = _.sortBy($scope.typeItems, function(x) {return (x.group || '') + x.name});


                        //$stateParams.property

                        if (!$stateParams.property) {

                            $scope.reload();
                        } else {

                            $propertyService.search({
                                limit: 1,
                                permission: ['PropertyManage','CompManage'],
                                active: true,
                                _id: $stateParams.property
                                , skipAmenities: true
                            }).then(function (response) {

                                if (response.data.properties || response.data.properties.length > 0) {
                                    $scope.propertyItems.push({id: $stateParams.property, name: response.data.properties[0].name})
                                }

                                $scope.reload();

                            }, function (error) {
                                $scope.reload();
                            })



                        }
                    },
                    function (error) {
                        $scope.localLoading = true;
                    });
            }
        });



        $scope.undo = function(row) {
            $dialog.confirm('Are you sure you want to Undo this item?', function() {
                $scope.localLoading = false;

                $auditService.undo(row._id).then(function (response) {
                        if (response.data.errors.length > 0) {
                            toastr.error( _.pluck(response.data.errors,'msg').join("<br>"));
                            $scope.localLoading = true;
                        }
                        else {
                            toastr.success("Undo action performed successfully.");
                            window.setTimeout(function() {$scope.reload();}, 1000);

                        }


                    },
                    function (error) {
                        toastr.error("Unable to undo. Please contact the administrator." );
                        $scope.localLoading = true;
                    });


            }, function() {

            })
        }

        $scope.getAudit = function(key) {
            return _.find($scope.audits, function(x) {return x.key == key})
        }

        $scope.resetPager = function () {
            $scope.pager.offset = 0;
            $scope.reload();
        }

        $scope.pagerChanged = function() {
            $scope.pager.offset = (($scope.pager.currentPage || 1) - 1) * parseInt($scope.pager.itemsPerPage)
            $scope.reload();
        }

        $scope.pageStart = function () {
            if ($scope.pager.count == 0) return 0;
            return (($scope.pager.currentPage || 1) - 1) * parseInt($scope.pager.itemsPerPage) + 1;
        }

        $scope.pageEnd = function () {
            if ($scope.pager.count == 0) return 0;
            var x = $scope.pageStart() - 1 + parseInt($scope.pager.itemsPerPage);

            if (x > $scope.pager.count) {
                x = $scope.pager.count;
            }

            return parseInt(x);
        }
    }]);
});