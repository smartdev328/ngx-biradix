'use strict';
define([
    'app',
], function (app) {
     app.controller
        ('manageCompsController', ['$scope', '$uibModalInstance', 'id', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService', '$uibModal','$dialog', function ($scope, $uibModalInstance, id, ngProgress, $rootScope, toastr, $location, $propertyService,$uibModal,$dialog) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            ga('set', 'title', "/manageComps");
            ga('set', 'page', "/manageComps");
            ga('send', 'pageview');

            $scope.cancel = function () {

                if ($scope.changed) {
                    $dialog.confirm('You have made changes that have not been saved. Are you sure you want to close without saving?', function () {
                        $uibModalInstance.dismiss('cancel');
                    }, function () {
                    });
                }
                else {
                    $uibModalInstance.dismiss('cancel');
                }

            };

            $scope.changed = false;
            $scope.MAX_COMPS = 20;

            $scope.save = function() {
                var compids = _.map($scope.comps,function(x) {return x._id.toString()});

                ngProgress.start();
                $('.btn').prop("disabled",true);


                $propertyService.saveCompOrder(id,compids).then(function (response) {

                    ngProgress.complete();
                    $('.btn').prop("disabled",false);

                    $uibModalInstance.close();
                }, function(response) {
                    toastr.error('Unable to save Comps. Please contact an administrator');
                    ngProgress.complete();
                    $('.btn').prop("disabled",false);

                });
            }

            $scope.getSummary = function(c) {
                return "<B>" + c.name + "</B><br>" + c.address + ", " + c.city + ", " + c.state;
            }

            $propertyService.search({
                limit: 20,
                permission: 'PropertyManage',
                ids: [id],
                select: "_id name custom comps.id comps.orderNumber"
                , skipAmenities: true
            }).then(function (response) {
                $scope.subject = response.data.properties[0]
                $scope.isCustom = !!($scope.subject.custom && $scope.subject.custom.owner);

                var compids = _.map($scope.subject.comps,function(x) {return x.id.toString()});

                $propertyService.search({
                    limit: 10000, permission: 'PropertyView', ids: compids, exclude: [id], select:"name address city state"
                    , skipAmenities: true
                }).then(function (response) {
                    $scope.localLoading = true;
                    $scope.comps = response.data.properties;
                    $scope.comps.forEach(function(c) {
                        c.summary = $scope.getSummary(c);

                        var comp = _.find($scope.subject.comps, function(x) {return x.id.toString() == c._id.toString()});

                        c.orderNumber = 999;

                        if (comp && typeof comp.orderNumber != 'undefined') {
                            c.orderNumber = comp.orderNumber;
                        }

                    })

                    $scope.comps = _.sortByAll($scope.comps, ['orderNumber','name']);
                });

            });

            $scope.remove = function(comp) {
                $scope.changed = true;
                _.remove($scope.comps, function(x) {return x._id == comp._id.toString()});
                $scope.search1 = "";

            }

            $scope.getLocation = function (val) {
                var compids = _.map($scope.comps,function(x) {return x._id.toString()});
                return $propertyService.search({search: val, active: true, exclude: [id], hideCustom: !$scope.isCustom}).then(function (response) {
                    return response.data.properties
                });
            };

            $scope.searchSelected = function (item, model, label) {
                $scope.upsert(item);
            }

            $scope.upsert = function(prop) {
                if ($scope.comps.length >= $scope.MAX_COMPS) {
                    $scope.search1 = "";
                    toastr.error("There are a maximum of 20 comps that can be added to a subject property");
                    return;
                }
                $scope.changed = true;
                prop.faded = true;
                prop.summary = $scope.getSummary(prop);

                var found = -1;

                for(var i =0; i < $scope.comps.length; i++) {
                    if ($scope.comps[i]._id.toString() == prop._id.toString()) {
                        found = i;
                        $scope.comps[i] = prop;
                    }
                }

                if (found  == -1) {
                    $scope.comps.push(prop);
                    found = $scope.comps.length - 1;
                }
                window.setTimeout(function() {
                    $scope.transition(found,function() {
                        prop.faded = false;
                    },true);

                }, 50);

                $scope.search1 = "";
            }

            $scope.moveUp = function(index) {
                if (1 == $scope.comps.length) return;

                if (index == 0) {
                    $scope.move($scope.comps,index, $scope.comps.length);
                }
                else {
                    $scope.move($scope.comps,index, index - 1);
                }
                $scope.changed = true;
            }

            $scope.moveDown = function(index) {
                if (1 == $scope.comps.length) return;

                if (index == $scope.comps.length - 1) {
                    $scope.move($scope.comps,index,0);
                }
                else {
                    $scope.move($scope.comps,index, index + 1);
                }
                $scope.changed = true;
            }

            $scope.move = function(ar, from, to) {
                $scope.transition(from, function() {
                    ar.splice(to, 0, ar.splice(from, 1)[0]);
                })
            };

            $scope.transition = function(index, callback, skipFadeOut) {
                var div = $("#tr-animate-" + index);

                var wait = 100;
                if (!skipFadeOut) {
                    div.addClass("fade-out");
                    wait = 100;
                }

                window.setTimeout(function() {
                    if (callback) {
                        callback();
                    }
                    window.setTimeout(function() {
                        div.removeClass("fade-out");
                        div.addClass("fade-in");
                        window.setTimeout(function () {
                            div.removeClass("fade-in");
                        }, 400);
                    },700);
                }, wait);
            }

            $scope.create = function() {
                if ($scope.comps.length >= $scope.MAX_COMPS) {
                    toastr.error("There are a maximum of 20 comps that can be added to a subject property");
                    return;
                }
                require([
                    '/app/propertyWizard/propertyWizardController.js'
                ], function () {
                    var modalInstance = $uibModal.open({
                        templateUrl: '/app/propertyWizard/propertyWizard.html?bust='+version,
                        controller: 'propertyWizardController',
                        size: "md",
                        keyboard: false,
                        backdrop: 'static',
                        resolve: {
                            id: function () {
                                return null;
                            },
                            isComp: function() {
                                return true;
                            },
                            subjectid: function() {
                                return $scope.subject._id;
                            },
                            isCustom: function() {
                                return $scope.isCustom;
                            }
                        }
                    });

                    modalInstance.result.then(function (comp) {
                        //Send successfully
                        $scope.upsert(comp);
                    }, function () {
                        //Cancel
                    });
                });
            }

        }]);

});