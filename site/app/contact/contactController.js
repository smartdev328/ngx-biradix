'use strict';
define([
    'app',
    '../../services/contactService.js'
], function (app) {
     app.controller
        ('contactController', ['$scope', '$modalInstance', 'me', 'ngProgress', '$rootScope','toastr', '$location', '$contactService', function ($scope, $modalInstance, me, ngProgress, $rootScope, toastr, $location, $contactService) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.submit = function (msg) {
                $('button.contact-submit').prop('disabled', true);
                $scope.msg.name = me.first + ' ' + me.last;
                $scope.msg.email = me.email;
                ngProgress.start();
                $contactService.send(msg).then(function (resp) {
                    $('button.contact-submit').prop('disabled', false);
                    ngProgress.complete();

                        if (resp.data.errors) {
                            var errors = _.pluck(resp.data.errors,"msg").join("<br>")
                            toastr.error(errors);
                        }
                        else {
                            toastr.success('Thank you for your submission. Someone will contact you shortly.');
                            $modalInstance.close();
                        }
                },
                    function(errors) {
                        toastr.error('Unable to access the system at this time. Please contact an administrator');
                        $('button.contact-submit').prop('disabled', false);
                        ngProgress.complete();
                    });
            }
        }]);
});