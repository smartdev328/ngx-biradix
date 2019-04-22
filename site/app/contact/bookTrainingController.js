'use strict';
define([
    'app',
    '../../services/contactService.js'
], function (app) {
     app.controller
        ('bookTrainingController', ['$scope', 'ngProgress', '$rootScope', 'toastr', '$contactService', '$propertyService', '$uibModalInstance', function ($scope, ngProgress, $rootScope, toastr, $contactService, $propertyService, $uibModalInstance) {
            
            $scope.cancel = function() {
                $uibModalInstance.dismiss("cancel");
            };

            $scope.currentDate = moment()._d;

            $scope.calendarSettings = {
                'autoUpdateInput': false,
                'singleDatePicker': true,
                'selectedWeekDate': $scope.currentDate.getDay(),
                'currentDate': $scope.currentDate,
                'placeholder': 'Date of training'
            }

            $scope.$watch('calendarSettings.currentDate', function(newVal,oldVal) {
                $scope.currentDate = newVal;
            });

            var me;
            $rootScope.$watch("me", function(x) {
                if ($rootScope.me) {
                    me = { first: $rootScope.me.first, last: $rootScope.me.last, email:  $rootScope.me.email }
                }
            });

            $scope.submitBooking = function (msg) {
                $('button.contact-submit').prop('disabled', true);
                $scope.msg.name = me.first + ' ' + me.last;
                $scope.msg.email = me.email;
                $scope.msg.subject = 'Training Request';
                $scope.msg.requesterName = $scope.msg.firstName + ' ' + $scope.msg.lastName;
                $scope.msg.date = $scope.currentDate;
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