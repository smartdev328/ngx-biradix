'use strict';
define([
    'app',
], function (app) {
     app.controller
        ('floorplanLinksController', ['$scope', '$uibModalInstance', 'id', 'compid', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService', function ($scope, $uibModalInstance, id, compid, ngProgress, $rootScope, toastr, $location, $propertyService) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            ga('set', 'title', "/compedFloorPlans");
            ga('set', 'page', "/compedFloorPlans");
            ga('send', 'pageview');
            
            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
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
                $scope.options = {searchLabel: 'Floor Plans', availableLabel: "Excluded", selectedLabel : "Included"}

                $scope.comp.floorplans = _.sortByAll($scope.comp.floorplans, ['bedrooms', 'bathrooms',  'sqft', 'description', 'units', 'id'])

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
                        return "0 Bedrooms";
                    default:
                        return fp.bedrooms + " Bedrooms";
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
                        toastr.success('Comped floor plans updated successfully.');
                        $rootScope.$broadcast('properties.excluded',id,compid, excluded);
                        $uibModalInstance.close();
                    }


                }, function (err) {
                    $('button.contact-submit').prop('disabled', false);
                    Raygun.send(new Error("User saw API unavailable error alert/message/page"));
                    toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
                    ngProgress.complete();
                });

            }

}]);

});