'use strict';
define([
    'app',
    '../../services/userService.js',
], function (app) {
     app.controller
        ('updateProfileController', ['$scope', '$authService', 'ngProgress', '$rootScope','toastr', '$location','$userService','$stateParams', function ($scope, $authService, ngProgress, $rootScope, toastr, $location,$userService,$stateParams) {
            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            if ($stateParams.password === "1") {
                $('html, body').animate({
                    scrollTop: ($('#passwordPannel').offset().top - 80)
                },500);
            }else {
                $('html, body').animate({
                    scrollTop: 0
                },500);
            }

            window.document.title = "My Account - Update Profile | BI:Radix";

            $rootScope.nav = "";

            $rootScope.sideMenu = true;
            $rootScope.sideNav = "UpdateProfile";


            var unbind = $rootScope.$watch("me", function(x) {
                if ($rootScope.me) {
                    $scope.user = { first: $rootScope.me.first, last:  $rootScope.me.last, email:  $rootScope.me.email }

                    $scope.canUpdateEmail = $rootScope.me.permissions.indexOf('Users/UpdateEmail') > -1

                    if (!$rootScope.me.passwordUpdated) {
                        toastr.warning('For security purposes, please update the temporary password assigned to you.');
                        unbind();
                    }
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
                        $rootScope.me.last = user.last;
                        $rootScope.me.first = user.first;
                        $rootScope.me.email = user.email;
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
        }]);
});