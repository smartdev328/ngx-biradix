'use strict';
define([
    'app',
    '../../services/contactService.js'
], function (app) {
     app.controller
        ('contactController', ['$scope', 'ngProgress', '$rootScope','toastr', '$location', '$contactService', '$propertyService', function ($scope, ngProgress, $rootScope, toastr, $location, $contactService,$propertyService) {
            window.setTimeout(function() {window.document.title = "Contact Us | BI:Radix";},1500);

            $rootScope.sideMenu = true;
            $rootScope.sideNav = "HelpContactUs";

            var me;
            $rootScope.$watch("me", function(x) {
                if ($rootScope.me) {
                    me = { first: $rootScope.me.first, last: $rootScope.me.last, email:  $rootScope.me.email }
                }
            })

            $scope.submit = function (msg) {
                $('button.contact-submit').prop('disabled', true);
                $scope.msg.name = me.first + ' ' + me.last;
                $scope.msg.email = me.email;
                ngProgress.start();

                $propertyService.search({
                    limit: 20,
                    permission: "PropertyManage",
                    active: true,
                    select: "name",
                    skipAmenities: true,
                }).then(function(response) {
                    msg.properties = response.data.properties.map(function(p) {
                        return p.name;
                    }).join(", ");

                    msg.role = $rootScope.me.roles[0];
                    msg.company = $rootScope.me.orgs.map(function(o) {
                        return o.name;
                    }).join(", ");

                    $contactService.send(msg).then(function (resp) {
                            $('button.contact-submit').prop('disabled', false);
                            ngProgress.complete();

                            if (resp.data.errors) {
                                var errors = _.pluck(resp.data.errors, "msg").join("<br>")
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
                });
            }
        }]);
});