'use strict';
define([
    'app',
], function (app) {
     app.controller
        ('copyAmenitiesController', ['$scope', '$uibModalInstance', 'fp','toastr','unitItems','unitAmenityOptions','$dialog','floorplans','$propertyService', function ($scope, $uibModalInstance, fp, toastr,unitItems,unitAmenityOptions,$dialog,floorplans,$propertyService) {

            $scope.unitAmenityOptions = unitAmenityOptions;
            
            //Clone amenities so we dont change master
            $scope.unitItemsCopy = _.cloneDeep(unitItems) || [];

            if (fp) {
                //select all seleced amenities in the copy of our unit amenities
                fp.amenities.forEach(function(pa) {
                    var am = _.find($scope.unitItemsCopy, function(a) {
                        return a.id.toString() == pa.toString()});
                    if (am) {
                        am.selected = true;
                    }
                })
            }

            $scope.floorplanGroup = function(fp) {
                switch (fp.bedrooms) {
                    case 0:
                        return "Studios";
                    default:
                        return fp.bedrooms + " Bedrooms"
                }
            }

            $scope.floorplanItems = [];
            $scope.floorplanOptions = {searchLabel: 'Floor Plans', availableLabel: "Available", selectedLabel : "Selected"}

            floorplans = _.sortByAll(floorplans, ['bedrooms', 'bathrooms',  'sqft', 'units', 'description', 'id'])

            floorplans.forEach(function(x) {
                if ((fp.id && x.id && x.id.toString() != fp.id.toString()) || fp != x) {
                    var link = {
                        fp: x,
                        name: $propertyService.floorplanName(x),
                        group: $scope.floorplanGroup(x),
                        selected: false
                    }


                    $scope.floorplanItems.push(link);
                }
            })


            //Clone the entire floor plan so we dont two way bind in case we need to cancel
            $scope.fpCopy = _.cloneDeep(fp) || {};

            $scope.changed = false;

            // $scope.startWatchingChanges = function() {
            //     window.setTimeout(function() {
            //         $scope.$watch("unitItemsCopy", function (newValue, oldValue) {
            //             if (JSON.stringify(newValue) != JSON.stringify(oldValue)) {
            //                 $scope.changed = true;
            //             }
            //         }, true);
            //     },1000);
            // }
            //
            // $scope.startWatchingChanges();


            $scope.cancel = function () {
                if ($scope.changed) {
                    $dialog.confirm('You have made changes that have not been saved. Are you sure you want to close without saving?', function () {
                        $uibModalInstance.dismiss('cancel');
                    }, function () {
                    });
                }
                else {
                    $uibModalInstance.dismiss('cancel');
                }
            };

            $scope.copy = function() {
                var fps = _.map(_.filter($scope.floorplanItems, function(i) {return i.selected == true}),function(x) {return x.fp});
                var aids = _.pluck(_.filter($scope.unitItemsCopy, function(i) {return i.selected == true}),"id");

                if (!aids.length) {
                    toastr.error('Please select at least 1 amenity to copy');
                    return;
                }

                if (!fps.length) {
                    toastr.error('Please select at least 1 floor plan to copy amenities to');
                    return;
                }

                var am;
                fps.forEach(function(cfp) {
                    aids.forEach(function(a) {
                       am = _.find(cfp.amenities,function(x) { return x.toString() == a.toString()});

                        if (!am) {
                            cfp.amenities.push(a.toString());
                        }
                    })
                })

                toastr.success('Amenities copied successfully');
                $uibModalInstance.close();
            }
        }]);

});