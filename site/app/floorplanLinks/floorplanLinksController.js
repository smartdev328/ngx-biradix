'use strict';
define([
    'app',
    '../../components/filterlist/module.js'
], function (app) {
     app.controller
        ('floorplanLinksController', ['$scope', '$modalInstance', 'id', 'compid', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService', function ($scope, $modalInstance, id, compid, ngProgress, $rootScope, toastr, $location, $propertyService) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $propertyService.search({
                limit: 20,
                permission: ['PropertyManage','CompManage'],
                ids: [id, compid],
                select: "_id name comps floorplans"
            }).then(function (response) {
                $scope.subject = _.find(response.data.properties, function(p) {return p._id.toString() == id})
                $scope.comp = _.find(response.data.properties, function(p) {return p._id.toString() == compid})
                var linkedfloorplans = _.find($scope.subject.comps, function(cm) {return cm.id == $scope.comp._id.toString()}).floorplans;

                $scope.items = [];
                $scope.options = {searchLabel: 'Floor Plans', availableLabel: "Excluded Floor Plans", selectedLabel : "Included Floor Plans"}

                $scope.comp.floorplans.forEach(function(fp) {
                    var link = {id: fp.id, name: $propertyService.floorplanName(fp), group: $scope.floorplanGroup(fp), selected: false}

                    var exists = _.find(linkedfloorplans, function(lfp) {return lfp.toString() == fp.id.toString()})

                    if (exists) {
                        link.selected = true;
                    }
                    $scope.items.push(link);
                })


                $scope.localLoading = true;

            });

            $scope.floorplanGroup = function(fp) {
                switch (fp.bedrooms) {
                    case 0:
                        return "Studios";
                    default:
                        return fp.bedrooms + " Bedrooms"
                }
            }

            $scope.save = function() {
                var floorplans = _.pluck(_.filter($scope.items, function(i) {return i.selected == true}),"id");
                var excluded = false;

                if (_.find($scope.items, function(i) {return i.selected == false})) {
                    excluded = true;
                }

                if (floorplans.length == 0) {
                    toastr.error("Please include at least one floor plan for comparing.");
                    return;
                }

                $('button.contact-submit').prop('disabled', true);
                ngProgress.start();
                $propertyService.saveCompLink(id, compid, floorplans, excluded).then(function (resp) {
                    $('button.contact-submit').prop('disabled', false);
                    ngProgress.complete();
                    if (resp.data.errors && resp.data.errors.length > 0) {
                        var errors = _.pluck(resp.data.errors,"msg").join("<br>")
                        toastr.error(errors);
                    }
                    else {
                        toastr.success('Link updated successfully.');
                        $rootScope.$broadcast('properties.excluded',id,compid, excluded);
                        $modalInstance.close();
                    }


                }, function (err) {
                    $('button.contact-submit').prop('disabled', false);
                    toastr.error('Unable to perform action. Please contact an administrator');
                    ngProgress.complete();
                });

            }

}]);

});