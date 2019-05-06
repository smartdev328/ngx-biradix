'use strict';
define([
    'app'
], function (app) {
     app.controller
        ('mapAmenityController', ['$scope', '$uibModalInstance', 'amenity', 'ngProgress', '$rootScope','toastr', '$location','amenities','$propertyAmenityService','$dialog', function ($scope, $uibModalInstance, amenity, ngProgress, $rootScope, toastr, $location, amenities, $propertyAmenityService,$dialog) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            ga('set', 'title', "/mapAmenities");
            ga('set', 'page', "/mapAmenities");
            ga('send', 'pageview');
            
            $scope.mapTo = {};
            $scope.amenity = amenity;
            $scope.amenities = _.filter(amenities, function(x) {return x.approved === true && x._id.toString() != amenity._id.toString() && x.type == amenity.type});

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.map = function() {
                $dialog.confirm('Are you sure you want to delete "<B>' + amenity.name +'</B> and map it as an Alias of <B>' + $scope.mapTo.name +'</B>"?', function() {
                    ngProgress.start();
                    $propertyAmenityService.mapAmenity(amenity._id, $scope.mapTo._id).then(function(response) {
                        if (response.data.errors) {
                            toastr.error(_.pluck(response.data.errors,'msg').join("<br>"));
                        }
                        else {
                            $uibModalInstance.close($scope.mapTo);
                        }
                        ngProgress.complete();
                    }, function(response) {
                        toastr.error('Unable to map amenity. Please contact an administrator.');
                        ngProgress.complete();
                    })

                }, function () {
                    
                });
            }


    }]);

});