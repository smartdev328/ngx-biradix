'use strict';
define([
    'app',
    '../../services/cronService.js',
], function (app) {
     app.controller
        ('updateProfileController', ['$scope', '$authService', 'ngProgress', '$rootScope','toastr', '$location','$userService','$stateParams','$propertyService','$cronService', function ($scope, $authService, ngProgress, $rootScope, toastr, $location,$userService,$stateParams,$propertyService,$cronService) {
            window.setTimeout(function() {window.document.title = "My Account - Update Profile | BI:Radix";},1500);

            $rootScope.nav = "";

            $rootScope.sideMenu = true;
            $rootScope.sideNav = "UpdateProfile";

            $scope.timezones = [
                {id: 'America/Los_Angeles', name: "Los Angeles (Pacific)"},
                {id: 'America/Phoenix', name: "Phoenix (Arizona)"},
                {id: 'America/Denver', name: "Denver (Mountain)"},
                {id: 'America/Chicago', name: "Chicago (Central)"},
                {id: 'America/New_York', name: "New York (Eastern)"},
            ];


            $scope.settings = {tz: $scope.timezones[0]}


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

                        }
                        else
                        if ($stateParams.settings === "1") {
                            $('html, body').animate({
                                scrollTop: ($('#settingsPanel').offset().top - 80)
                            },500);

                        }
                        else {
                            $('html, body').animate({
                                scrollTop: 0
                            },500);
                        }
                    }, 500)

                    $scope.settings.tz = _.find($scope.timezones, function(x) {return x.id == $rootScope.me.settings.tz});



                    $scope.user = { first: $rootScope.me.first, last:  $rootScope.me.last, email:  $rootScope.me.email }

                    $scope.canUpdateEmail = $rootScope.me.permissions.indexOf('Users/UpdateEmail') > -1

                    if (!$rootScope.me.passwordUpdated) {
                        toastr.warning('For security purposes, please update the temporary password assigned to you.');
                    }

                    if ($rootScope.me.bounceReason) {
                        toastr.error('We were unable to deliver email to your email address: <b>' + $rootScope.me.email + '</b>. Please verify your email address and click "Update".');
                    }

                    //$rootScope.me.settings.notifications.props = ['5642bae9ff18a018187b2e9f','5642bab4ff18a018187b0417'];

                    $scope.nots = $cronService.getOptions($rootScope.me.settings.notifications.cron);

                    $scope.nots.all = !$rootScope.me.settings.notifications.props || !$rootScope.me.settings.notifications.props.length;

                    $scope.propertyOptions = { panelWidth:210, minwidth:'100%', hideSearch: false, dropdown: true, dropdownDirection : 'left', labelAvailable: "Excluded Properties", labelSelected: "Included Properties", searchLabel: "Properties" }

                    $scope.columnsOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'right', labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields" }
                    $scope.columnsItems = [
                        {id: "occupancy", name: "Occ. %", selected: $rootScope.me.settings.notification_columns.occupancy},
                        {id: "leased", name: "Leased %", selected: $rootScope.me.settings.notification_columns.leased},
                        {id: "weekly", name: "Traffic & Leases / Week", selected: $rootScope.me.settings.notification_columns.weekly},
                        {id: "units", name: "Units", selected: $rootScope.me.settings.notification_columns.units},
                        {id: "sqft", name: "Sqft", selected: $rootScope.me.settings.notification_columns.sqft},
                        {id: "rent", name: "Rent", selected: $rootScope.me.settings.notification_columns.rent},
                        {id: "concessions", name: "Total Concession", selected: $rootScope.me.settings.notification_columns.concessions},
                        {id: "runrate", name: "Recurring Rent", selected: $rootScope.me.settings.notification_columns.runrate},
                        {id: "runratesqft", name: "Recurring Rent / Sqft", selected: $rootScope.me.settings.notification_columns.runratesqft},
                        {id: "ner", name: "Net Eff. Rent", selected: $rootScope.me.settings.notification_columns.ner},
                        {id: "nersqft", name: "Net Eff. Rent / Sqft", selected: $rootScope.me.settings.notification_columns.nersqft},
                        {id: "nersqftweek", name: "NER/Sqft vs Last Week", selected: $rootScope.me.settings.notification_columns.nersqftweek},
                        {id: "nersqftmonth", name: "NER/Sqft vs Last Month", selected: $rootScope.me.settings.notification_columns.nersqftmonth},
                        {id: "nersqftyear", name: "NER/Sqft vs Last Year", selected: $rootScope.me.settings.notification_columns.nersqftyear},
                        {id: "nervscompavg", name: "NER vs Comp Avg", selected: $rootScope.me.settings.notification_columns.nervscompavg},
                        {id: "last_updated", name: "Last Updated", selected: $rootScope.me.settings.notification_columns.last_updated},
                    ];

                    if (!$rootScope.me.settings.showLeases) {
                        _.remove($scope.columnsItems, function(x) {return x.id == 'leased'})
                    }

                    $propertyService.search({
                        limit: 10000,
                        permission: 'PropertyManage',
                        active: true
                        , skipAmenities: true
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
                        user.newpassword = "";
                        user.confirmpassword = "";
                        user.currentpassword = "";
                        $scope.myFormPassword.$setPristine();
                    }

                }, function (err) {
                    $('button.contact-submit').prop('disabled', false);
                    toastr.error('Unable to perform action. Please contact an administrator');
                    ngProgress.complete();
                });
            }

            $scope.saveNotifications = function() {
                if ($rootScope.me.settings.notifications.on === true) {

                    if ($scope.nots.all === true) {
                        $rootScope.me.settings.notifications.props = [];
                    } else {
                        $rootScope.me.settings.notifications.props = _.pluck(_.filter($scope.propertyItems, function(x) {return x.selected === true}),"id")
                    }

                    $rootScope.me.settings.notifications.cron = $cronService.getCron($scope.nots);

                    var c= 0;
                    $scope.columnsItems.forEach(function (f) {
                        $rootScope.me.settings.notification_columns[f.id] = f.selected;

                        if (f.selected === true) {
                            c++;
                        }
                    })

                    if (c > 13) {
                        toastr.error("<B>Unable to Update Notification Settings!</B><Br><Br>You have selected <b>" + c + "</b> columns for your competitor report. Having over <u>13</u> columns will not fit in the property status update.")

                        return;
                    }



                }

                $('button.contact-submit').prop('disabled', true);
                ngProgress.start();

                $authService.updateSettings($rootScope.me.settings).then(function (resp) {
                    $('button.contact-submit').prop('disabled', false);
                    ngProgress.complete();
                    if (resp.data.errors && resp.data.errors.length > 0) {
                        resp.data.errors.forEach(function(e) {
                            toastr.error(e.msg);
                        })

                    }
                    else {
                        toastr.success('Notifications updated successfully.');

                        $rootScope.refreshToken(function() {});
                    }

                }, function (err) {
                    $('button.contact-submit').prop('disabled', false);
                    toastr.error('Unable to save Notifications. Please contact an administrator');
                    ngProgress.complete();
                });
            }

            $scope.saveSettings = function() {

                $rootScope.me.settings.tz = $scope.settings.tz.id;
                //console.log($rootScope.me.settings.notifications);

                $('button.contact-submit').prop('disabled', true);
                ngProgress.start();

                $authService.updateSettings($rootScope.me.settings).then(function (resp) {
                    $('button.contact-submit').prop('disabled', false);
                    ngProgress.complete();
                    if (resp.data.errors && resp.data.errors.length > 0) {
                        resp.data.errors.forEach(function(e) {
                            toastr.error(e.msg);
                        })

                    }
                    else {
                        toastr.success('Settings updated successfully.');

                        $rootScope.refreshToken(function() {});
                    }

                }, function (err) {
                    $('button.contact-submit').prop('disabled', false);
                    toastr.error('Unable to save Settings. Please contact an administrator');
                    ngProgress.complete();
                });
            }

            $scope.sendReport = function() {

                var c= 0;
                var notification_columns = {};
                $scope.columnsItems.forEach(function (f) {
                    notification_columns[f.id] = f.selected;

                    if (f.selected === true) {
                        c++;
                    }
                })

                if (c > 13) {
                    toastr.error("<B>Unable to Update Notification Settings!</B><Br><Br>You have selected <b>" + c + "</b> columns for your competitor report. Having over <u>13</u> columns will not fit in the property status update.")

                    return;
                }

                var properties= [];
                if (!$scope.nots.all) {
                    properties = _.pluck(_.filter($scope.propertyItems, function(x) {return x.selected === true}),"id");
                }
                $propertyService.notifications_test(properties,$rootScope.me.settings.showLeases,notification_columns);
                toastr.success('Your request for a notifications report has been submitted. Please allow up to 5 minutes to receive your report.');
            }
        }]);

});