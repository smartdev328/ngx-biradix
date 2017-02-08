'use strict';
define([
    'app',
    '../../services/contactService.js'
], function (app) {
     app.controller
        ('contactController', ['$scope', 'ngProgress', '$rootScope','toastr', '$location', '$contactService', function ($scope, ngProgress, $rootScope, toastr, $location, $contactService) {

            window.setTimeout(function() {window.document.title = "Contact Us | BI:Radix";},1500);

            $rootScope.sideMenu = true;
            $rootScope.sideNav = "ContactUs";

            var me;
            $rootScope.$watch("me", function(x) {
                if ($rootScope.me) {
                    me = { first: $rootScope.me.first, last:  $rootScope.me.last, email:  $rootScope.me.email }
                }
            })

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
                            //toastr.success('Thank you for your submission. Someone will contact you shortly.');
                            $scope.done = true
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