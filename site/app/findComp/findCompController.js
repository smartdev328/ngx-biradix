'use strict';
define([
    'app'
], function (app) {
     app.controller
        ('findCompController', ['$scope', '$uibModalInstance', 'id', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService', function ($scope, $uibModalInstance, id, ngProgress, $rootScope, toastr, $location, $propertyService) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.disableSearchKeys = function(event) {
                switch(event.keyCode) {
                    case 191: // "/"
                    case 220: // "\"
                        event.preventDefault();
                }
            }
            
            $propertyService.search({
                limit: 20,
                permission: 'PropertyManage',
                ids: [id],
                select: "_id name comps.id"
            }).then(function (response) {
                $scope.subject = response.data.properties[0]
                $scope.exclude = _.pluck($scope.subject.comps,"id");

                $scope.exclude.forEach(function(x) {x = x.toString()});

                $propertyService.search({limit: 10000, permission: 'PropertyView', ids: $scope.exclude, exclude: [id], select:"name address city state"}).then(function (response) {
                    $scope.localLoading = true;
                    $scope.comps = response.data.properties;
                    $scope.comps.forEach(function(c) {
                        c.summary = c.name + "<br><i>" + c.address + ", " + c.city + ", " + c.state + "</i>";
                    })
                });



            });


            $scope.create = function () {
                $uibModalInstance.dismiss('create');
            };

            $scope.autoComplete = function() {
                if ($scope.findComp && $scope.findComp.length > 1) {
                    $propertyService.search({search: $scope.findComp, active: true}).then(function (response) {
                        $scope.properties = response.data.properties;
                        $scope.properties.forEach(function(p) {
                            if ($scope.exclude.indexOf(p._id.toString()) > -1) {
                                p.disabled = true;
                            }
                        })
                    });
                }
            }

            $scope.remove = function(comp) {
                _.remove($scope.exclude, function(x) {return x == comp._id.toString()});
                _.remove($scope.comps, function(x) {return x._id == comp._id.toString()});
                $scope.autoComplete();

            },

            $scope.link = function(comp) {
                $scope.exclude.push(comp._id.toString());
                $scope.comps.push(comp);
                $scope.autoComplete();
                // ngProgress.start();
                // $propertyService.linkComp(id, comp._id).then(function (resp) {
                //     ngProgress.complete();
                //     if (resp.data.errors && resp.data.errors.length > 0) {
                //         var errors = resp.data.errors
                //         toastr.error(errors);
                //     }
                //     else {
                //         $uibModalInstance.close(comp);
                //     }
                //
                //
                // }, function (err) {
                //     toastr.error('Unable to perform action. Please contact an administrator');
                //     ngProgress.complete();
                // });
            }

}]);

});