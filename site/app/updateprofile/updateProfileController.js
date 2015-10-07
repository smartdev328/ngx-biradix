'use strict';
define([
    'app',
], function (app) {
     app.controller
        ('updateProfileController', ['$scope', '$authService', 'ngProgress', '$rootScope','toastr', '$location', function ($scope, $authService, ngProgress, $rootScope, toastr, $location) {
            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            window.document.title = "My Account - Update Profile | BI:Radix";

            $rootScope.nav = "";

            $rootScope.sideMenu = true;
            $rootScope.sideNav = "UpdateProfile";


            $rootScope.$watch("me", function(x) {
                if ($rootScope.me) {
                    $scope.user = { first: $rootScope.me.first, last:  $rootScope.me.last, email:  $rootScope.me.email }

                    $scope.canUpdateEmail = $rootScope.me.permissions.indexOf('Users/UpdateEmail') > -1
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
        }]);
});