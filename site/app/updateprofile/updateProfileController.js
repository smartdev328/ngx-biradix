'use strict';
define([
    'app',
], function (app) {
     app.controller
        ('updateProfileController', ['$scope', '$modalInstance', 'me', '$authService', 'ngProgress', '$rootScope','toastr', function ($scope, $modalInstance, me, $authService, ngProgress, $rootScope, toastr) {
            $scope.alerts = [];
            
            $scope.user = { first: me.first, last: me.last, email: me.email }

            $scope.canUpdateEmail = $rootScope.me.permissions.indexOf('Users/UpdateEmail') > -1
            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.submit = function (user) {
                $scope.alerts = [];
                $('button.contact-submit').prop('disabled', true);
                ngProgress.start();
                $authService.updateMe(user).then(function (resp) {
                    $('button.contact-submit').prop('disabled', false);
                    ngProgress.reset();
                    if (resp.data.errors && resp.data.errors.length > 0) {
                        var errors = _.pluck(resp.data.errors,"msg").join("<br>")
                        toastr.error(errors);
                    }
                    else {
                        toastr.success('Profile updated successfully.');
                        me.last = user.last;
                        me.first = user.first;
                        me.email = user.email;
                        $modalInstance.close();
                    }
                    

                }, function (err) {
                    $('button.contact-submit').prop('disabled', false);
                    toastr.error('Unable to access the system as this time. Please contact an administrator');
                    ngProgress.reset();
                });
            }
        }]);
});