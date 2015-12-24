'use strict';
define([
    'app',
    '../../services/userService.js',
    '../../services/propertyService',
    '../../components/toggle/module',
    '../../components/filterlist/module.js',
], function (app) {
     app.controller
        ('updateProfileController', ['$scope', '$authService', 'ngProgress', '$rootScope','toastr', '$location','$userService','$stateParams','$propertyService', function ($scope, $authService, ngProgress, $rootScope, toastr, $location,$userService,$stateParams,$propertyService) {
            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            window.document.title = "My Account - Update Profile | BI:Radix";

            $rootScope.nav = "";

            $rootScope.sideMenu = true;
            $rootScope.sideNav = "UpdateProfile";


            $scope.nots = {
                howOftenOptions: ["Weekly","Monthly"],
                daysOfWeek: [
                    {id:0,name:'Sunday'},
                    {id:1,name:'Monday'},
                    {id:2,name:'Tuesday'},
                    {id:3,name:'Wednesday'},
                    {id:4,name:'Thursday'},
                    {id:5,name:'Friday'},
                    {id:6,name:'Saturday'},
                ],

                daysOfMonth: [

                ],
            };

            for (var i = 1; i < 29; i++) {
                var name = "th";
                if (i == 1 || i == 21 || i == 31) {name = "st"}
                if (i == 2 || i == 22) {name = "nd"}
                if (i == 3 || i == 23) {name = "rd"}

                $scope.nots.daysOfMonth.push({id:i,name: i.toString() + name})
            }

            $scope.nots.daysOfMonth.push({id:"L",name:'Last'});

            var unbind = $rootScope.$watch("me", function(x) {
                if ($rootScope.me) {
                    window.setTimeout(function() {
                        if ($stateParams.password === "1") {
                            $('html, body').animate({
                                scrollTop: ($('#passwordPannel').offset().top - 80)
                            }, 500);
                        }
                        else
                        if ($stateParams.notifications === "1") {
                            $('html, body').animate({
                                scrollTop: ($('#notificationsPanel').offset().top - 80)
                            },500);
                        }else {
                            $('html, body').animate({
                                scrollTop: 0
                            },500);
                        }
                    }, 500)


                    $scope.user = { first: $rootScope.me.first, last:  $rootScope.me.last, email:  $rootScope.me.email }

                    $scope.canUpdateEmail = $rootScope.me.permissions.indexOf('Users/UpdateEmail') > -1

                    if (!$rootScope.me.passwordUpdated) {
                        toastr.warning('For security purposes, please update the temporary password assigned to you.');
                    }

                    if ($rootScope.me.bounceReason) {
                        toastr.error('We were unable to deliver email to your email address: <b>' + $rootScope.me.email + '</b>. Please verify your email address and click "Update".');
                    }

                    //$rootScope.me.settings.notifications.props = ['5642bae9ff18a018187b2e9f','5642bab4ff18a018187b0417'];

                    $scope.nots.howOften = $scope.nots.howOftenOptions[0];
                    $scope.nots.dayOfWeek = $scope.nots.daysOfWeek[2];
                    $scope.nots.dayOfMonth = $scope.nots.daysOfMonth[0];
                    $scope.nots.all = !$rootScope.me.settings.notifications.props || !$rootScope.me.settings.notifications.props.length;

                    var cron = $rootScope.me.settings.notifications.cron.split(" ");

                    if (cron[4] == "*") {
                        $scope.nots.howOften = $scope.nots.howOftenOptions[1]
                        $scope.nots.dayOfMonth = _.find($scope.nots.daysOfMonth, function(x) {
                            return x.id.toString() == cron[2];
                        })
                    }
                    else {
                        $scope.nots.dayOfWeek = _.find($scope.nots.daysOfWeek, function(x) {
                            return x.id.toString() == cron[4];
                        })
                    }



                    $scope.propertyOptions = { panelWidth:210, minwidth:'100%', hideSearch: false, dropdown: true, dropdownDirection : 'left', labelAvailable: "Excluded Properties", labelSelected: "Included Properties", searchLabel: "Properties" }

                    $propertyService.search({
                        limit: 1000,
                        permission: 'PropertyManage',
                        active: true
                    }).then(function (response) {
                        //$scope.myProperties = response.data.properties;
                        $scope.notificationsLoaded = true;

                        $scope.propertyItems = [];

                        response.data.properties.forEach(function(a) {
                            var selected = true;
                            if (!$scope.nots.all) {
                                selected = $rootScope.me.settings.notifications.props.indexOf(a._id.toString()) > -1;
                            }
                            $scope.propertyItems.push({id: a._id, name: a.name, selected: selected})
                        })

                    }, function (error) {
                        if (error.status == 401) {
                            $rootScope.logoff();
                            return;
                        }

                        toastr.error('Unable to retrieve your properties. Please contact an administrator');
                    })
                    unbind();
                }
            })

            $scope.submit = function (user) {
                $('button.contact-submit').prop('disabled', true);
                ngProgress.start();
                $authService.updateMe(user).then(function (resp) {
                    $('button.contact-submit').prop('disabled', false);
                    ngProgress.complete();
                    if (resp.data.errors && resp.data.errors.length > 0) {
                        var errors = _.pluck(resp.data.errors,"msg").join("<br>")
                        toastr.error(errors);
                    }
                    else {
                        toastr.success('Profile updated successfully.');
                        $rootScope.refreshToken(function() {

                        });
                    }
                    

                }, function (err) {
                    $('button.contact-submit').prop('disabled', false);
                    toastr.error('Unable to perform action. Please contact an administrator');
                    ngProgress.complete();
                });
            }

            $scope.password = {};

            $scope.submitPassword = function (user) {
                if (user.newpassword != user.confirmpassword) {
                    toastr.error('Passwords do not match.');
                    return;
                }
                $('button.contact-submit').prop('disabled', true);
                ngProgress.start();

                $userService.updatePassword(user).then(function (resp) {
                    $('button.contact-submit').prop('disabled', false);
                    ngProgress.complete();
                    if (resp.data.errors && resp.data.errors.length > 0) {
                        resp.data.errors.forEach(function(e) {
                            toastr.error(e.msg);
                        })

                    }
                    else {
                        toastr.success('Password updated successfully.');
                    }

                }, function (err) {
                    $('button.contact-submit').prop('disabled', false);
                    toastr.error('Unable to perform action. Please contact an administrator');
                    ngProgress.complete();
                });
            }

            $scope.sendReport = function() {
                var properties= [];
                if (!$scope.nots.all) {
                    properties = _.pluck(_.filter($scope.propertyItems, function(x) {return x.selected === true}),"id");
                }
                $propertyService.notifications_test(properties);
                toastr.success('Your request for a notifications report has been submitted. Please allow up to 5 minutes to receive your report.');
            }
        }]);

});