'use strict';
define([
    'app',
    '../../components/inputmask/module.js',
    'async!//maps.googleapis.com/maps/api/js?key=AIzaSyDSPRIxjN2eQGgXzcDVXHemAG5Lf9GVdgk&v=3.exp&libraries=places',
    '../../components/dialog/module.js',
    '../../services/amenityService.js'
], function (app) {
     app.controller
        ('propertyWizardController', ['$scope', '$modalInstance', 'id', 'isComp', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService', '$dialog','$amenityService','$modal','subjectid', function ($scope, $modalInstance, id, isComp, ngProgress, $rootScope, toastr, $location, $propertyService,$dialog,$amenityService,$modal,subjectid) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };

            $scope.values = {};

            $scope.id = id;

            $scope.getTitle = function() {
                var title = "";
                if (!id && isComp) {
                    title = "Create Comp"
                } else if (!id && !isComp) {
                    title = "Create Property"
                }
                else
                if (id && isComp) {
                    title = "Edit Comp"
                } else if (id && !isComp) {
                    title = "Edit Property"
                }

                if ($scope.property.name) {
                    title += ": " + $scope.property.name;
                }

                return title;
            }


            $scope.steps = [
                {label:'Property Info', template: 'propertyInfo.html'},
                {label:'Amenities', template: 'amenities.html'},
                {label:'Fees/Deposits', template: 'feesDeposits.html'},
                {label:'Floor Plans', template: 'floorplans.html'},
                {label:'Contact/Notes', template: 'notes.html'},
            ]


            $scope.changeStep = function(i) {
                if (i < 0) {
                    i = 0;
                }

                if (i >= $scope.steps.length) {
                    i = $scope.steps.length - 1;
                }
                $scope.stepIndex = i;
                $scope.stepTemplate = '/app/propertyWizard/tabs/' + $scope.steps[i].template + "?bust=" + version;

            }

            $scope.changeStep(0);
            $scope.property = {fees: {}, floorplans: [] }

            $scope.constructionTypes = ['Garden','Highrise','Midrise','Platform','Wrap']
            $scope.states = [
                {
                    "name": "Alabama",
                    "abbreviation": "AL"
                },
                {
                    "name": "Alaska",
                    "abbreviation": "AK"
                },
                {
                    "name": "Arizona",
                    "abbreviation": "AZ"
                },
                {
                    "name": "Arkansas",
                    "abbreviation": "AR"
                },
                {
                    "name": "California",
                    "abbreviation": "CA"
                },
                {
                    "name": "Colorado",
                    "abbreviation": "CO"
                },
                {
                    "name": "Connecticut",
                    "abbreviation": "CT"
                },
                {
                    "name": "Delaware",
                    "abbreviation": "DE"
                },
                {
                    "name": "District Of Columbia",
                    "abbreviation": "DC"
                },
                {
                    "name": "Florida",
                    "abbreviation": "FL"
                },
                {
                    "name": "Georgia",
                    "abbreviation": "GA"
                },
                {
                    "name": "Hawaii",
                    "abbreviation": "HI"
                },
                {
                    "name": "Idaho",
                    "abbreviation": "ID"
                },
                {
                    "name": "Illinois",
                    "abbreviation": "IL"
                },
                {
                    "name": "Indiana",
                    "abbreviation": "IN"
                },
                {
                    "name": "Iowa",
                    "abbreviation": "IA"
                },
                {
                    "name": "Kansas",
                    "abbreviation": "KS"
                },
                {
                    "name": "Kentucky",
                    "abbreviation": "KY"
                },
                {
                    "name": "Louisiana",
                    "abbreviation": "LA"
                },
                {
                    "name": "Maine",
                    "abbreviation": "ME"
                },
                {
                    "name": "Maryland",
                    "abbreviation": "MD"
                },
                {
                    "name": "Massachusetts",
                    "abbreviation": "MA"
                },
                {
                    "name": "Michigan",
                    "abbreviation": "MI"
                },
                {
                    "name": "Minnesota",
                    "abbreviation": "MN"
                },
                {
                    "name": "Mississippi",
                    "abbreviation": "MS"
                },
                {
                    "name": "Missouri",
                    "abbreviation": "MO"
                },
                {
                    "name": "Montana",
                    "abbreviation": "MT"
                },
                {
                    "name": "Nebraska",
                    "abbreviation": "NE"
                },
                {
                    "name": "Nevada",
                    "abbreviation": "NV"
                },
                {
                    "name": "New Hampshire",
                    "abbreviation": "NH"
                },
                {
                    "name": "New Jersey",
                    "abbreviation": "NJ"
                },
                {
                    "name": "New Mexico",
                    "abbreviation": "NM"
                },
                {
                    "name": "New York",
                    "abbreviation": "NY"
                },
                {
                    "name": "North Carolina",
                    "abbreviation": "NC"
                },
                {
                    "name": "North Dakota",
                    "abbreviation": "ND"
                },
                {
                    "name": "Ohio",
                    "abbreviation": "OH"
                },
                {
                    "name": "Oklahoma",
                    "abbreviation": "OK"
                },
                {
                    "name": "Oregon",
                    "abbreviation": "OR"
                },
                {
                    "name": "Palau",
                    "abbreviation": "PW"
                },
                {
                    "name": "Pennsylvania",
                    "abbreviation": "PA"
                },
                {
                    "name": "Rhode Island",
                    "abbreviation": "RI"
                },
                {
                    "name": "South Carolina",
                    "abbreviation": "SC"
                },
                {
                    "name": "South Dakota",
                    "abbreviation": "SD"
                },
                {
                    "name": "Tennessee",
                    "abbreviation": "TN"
                },
                {
                    "name": "Texas",
                    "abbreviation": "TX"
                },
                {
                    "name": "Utah",
                    "abbreviation": "UT"
                },
                {
                    "name": "Vermont",
                    "abbreviation": "VT"
                },
                {
                    "name": "Virginia",
                    "abbreviation": "VA"
                },
                {
                    "name": "Washington",
                    "abbreviation": "WA"
                },
                {
                    "name": "West Virginia",
                    "abbreviation": "WV"
                },
                {
                    "name": "Wisconsin",
                    "abbreviation": "WI"
                },
                {
                    "name": "Wyoming",
                    "abbreviation": "WY"
                }
            ];

            $scope.getSelectedState = function(abbr) {
                var resp;
                $scope.states.forEach(function (s) {
                    if (s.abbreviation === abbr) {
                        resp = s;
                    }
                })

                return resp;
            }

            $scope.getSelectedOrg = function(id) {
                var resp;

                if (id) {
                    $scope.lookups.orgs.forEach(function (s) {
                        if (s._id && s._id.toString() === id.toString()) {
                            resp = s;
                        }
                    })
                }

                if (!resp) {
                    resp = $scope.lookups.orgs[0]
                }

                return resp;
            }

            $scope.locationAmenityOptions = { labelAvailable: "Available Amenities", labelSelected: "Selected Amenities", searchLabel: "Location Amenities" }
            $scope.communityAmenityOptions = { labelAvailable: "Available Amenities", labelSelected: "Selected Amenities", searchLabel: "Community Amenities" }
            $scope.unitAmenityOptions = { labelAvailable: "Available Amenities", labelSelected: "Selected Amenities", searchLabel: "Unit Amenities" }

            $propertyService.lookups().then(function (response) {
                $scope.lookups = response.data;

                $scope.lookups.orgs.unshift({id: null, name: 'None'})

                $scope.communityItems = [];
                $scope.locationItems = [];
                $scope.unitItems = [];
                $scope.lookups.amenities.forEach(function(a) {
                    var ar = a.name.split(' - ');
                    var am;
                    if (ar && ar.length == 2 ) {
                        am = {id: a._id, name: ar[1], group: ar[0], selected: false};
                    } else {
                        am = {id: a._id, name: a.name, selected: false};
                    }


                    switch(a.type) {
                        case 'Community':
                            $scope.communityItems.push(am);
                            break;
                        case 'Location':
                            $scope.locationItems.push(am);
                            break;
                        case 'Unit':
                            $scope.unitItems.push(am);
                            break;

                    }
                })

                if (id) {
                    $propertyService.getFullProperty(id).then(function (response) {
                        $scope.property = response.data.properties[0];
                        $scope.localLoading = true;

                        $scope.property.state = $scope.getSelectedState($scope.property.state)

                        $scope.property.orgid = $scope.getSelectedOrg($scope.property.orgid)

                        $scope.property.floorplans = $scope.property.floorplans || [];

                        $scope.property.averageSqft = 0
                        if ($scope.property.floorplans.length > 0) {
                            $scope.property.floorplans.forEach(function (fp) {
                                fp.bathrooms = parseFloat(fp.bathrooms);
                                $scope.property.averageSqft += fp.sqft;
                            })

                            $scope.property.averageSqft /= $scope.property.floorplans.length;
                        }


                        $scope.property.community_amenities.forEach(function(pa) {
                            var am = _.find($scope.communityItems, function(a) {
                                return a.id.toString() == pa.toString()});
                            if (am) {
                                am.selected = true;
                            }
                        })

                        $scope.property.location_amenities.forEach(function(pa) {
                            var am = _.find($scope.locationItems, function(a) {
                                return a.id.toString() == pa.toString()});
                            if (am) {
                                am.selected = true;
                            }
                        })

                    });
                }
                else {
                    $scope.localLoading = true;
                    $scope.property.orgid = $scope.getSelectedOrg($scope.property.orgid)
                }
            });

            $scope.placeToAddress = function(place) {
                if (place.formatted_phone_number) {
                    $scope.property.phone = place.formatted_phone_number;
                }

                if (place.address_components) {
                    var state = "";
                    place.address_components.forEach(function (c) {
                        switch (c.types[0]) {
                            case "street_number":
                                $scope.property.address = c.short_name;
                                break;
                            case "route":
                                $scope.property.address += " " + c.long_name;
                                break;
                            case "postal_code":
                                $scope.property.zip = c.short_name;
                                break;
                            case "locality":
                                $scope.property.city = c.long_name;
                                break;
                            case "administrative_area_level_1":
                                state = c.short_name;
                                break;
                        }
                    })

                    if (state != "") {
                        $scope.property.state = $scope.getSelectedState(state)
                    }
                }



            }

            $scope.googleBlur = function(id, value) {
                $(id).on("blur", function() {
                    $(id).off("blur");
                    window.setTimeout(function() {
                        $(id).val(value)
                    }, 200)
                })
            }

            $scope.initAutocomplete = function() {
                var autocomplete2 = new google.maps.places.Autocomplete(
                    (document.getElementById('autocomplete2'))
                    ,{ types: ['geocode'], componentRestrictions: {country:'us'} }
                );

                google.maps.event.addListener(autocomplete2, 'place_changed', function () {
                    var place = autocomplete2.getPlace();
                    $scope.placeToAddress(place);
                    var address = _.cloneDeep($scope.property.address);
                    $scope.googleBlur('#autocomplete2',address)
                });

                var autocomplete = new google.maps.places.Autocomplete(
                    (document.getElementById('autocomplete'))
                    ,{ componentRestrictions: {country:'us'} }
                );

                google.maps.event.addListener(autocomplete, 'place_changed', function () {
                    var place = autocomplete.getPlace();
                    $scope.googleBlur('#autocomplete',place.name)
                    $scope.property.name=place.name;
                    $scope.placeToAddress(place);
                });
            }

            $scope.removeFloorplan = function(fp) {
                $dialog.confirm('Are you sure you want to remove the following floor plan: ' + $propertyService.floorplanName(fp) + '?', function() {
                    var i = $scope.property.floorplans.indexOf(fp);
                    $scope.property.floorplans.splice(i,1);
                }, function() {});
            }

            $scope.addAmenity = function(type, list) {
                if ($scope.values['new' + type + 'Amenity']) {
                    var amenity = {type : type, name: $scope.values['new' + type + 'Amenity']};

                    ngProgress.start();
                    $('#add' + type +'Amenity').prop("disabled",true);

                    $amenityService.create(amenity).then(
                        function(response) {
                            if (response.data.errors) {
                                toastr.error(_.pluck(response.data.errors,'msg').join("<br>"));
                            }
                            else {
                                $scope.values['new' + type + 'Amenity'] = '';

                                var newAm = response.data.amenity;
                                toastr.success(newAm.name + ' added successfully.');

                                var exists = _.find(list, function(x) {return x.id.toString() == newAm._id.toString() });

                                if (exists) {
                                    exists.selected = true;
                                } else {

                                    var ar = newAm.name.split(' - ');
                                    var am;
                                    if (ar && ar.length == 2 ) {
                                        am = {id: newAm._id, name: ar[1], group: ar[0], selected: true};
                                    } else {
                                        am = {id: newAm._id, name: newAm.name, selected: true};
                                    }

                                    list.push(am)
                                }

                            }

                            ngProgress.complete();
                            $('#add' + type + 'Amenity').prop("disabled",false);
                        }
                        , function(response) {
                            toastr.error('Unable to create amenity. Please contact an administrator');
                            ngProgress.complete();
                            $('#add' + type + 'Amenity').prop("disabled",false);
                        });
                }
            }

            $scope.addFloorplan = function(fp) {
                require([
                    '/app/propertyWizard/editFloorplanController.js'
                ], function () {
                    var modalInstance = $modal.open({
                        templateUrl: '/app/propertyWizard/tabs/editFloorplanController.html?bust=' + version,
                        controller: 'editFloorplanController',
                        size: "md",
                        keyboard: false,
                        backdrop: 'static',
                        resolve: {
                            //floor plan we are editing or null
                            fp: function () {
                                return fp;
                            },
                            //select list items for unit amenities
                            unitItems: function () {
                                return $scope.unitItems;
                            } ,
                            //select list options
                            unitAmenityOptions: function () {
                                return $scope.unitAmenityOptions;
                            },
                            //values object so we can reuse the add-amenity function
                            values: function () {
                                return $scope.values;
                            },
                            //global function to manage the complex logic of adding amenities to a list
                            addAmenityGlobal: function () {
                                return $scope.addAmenity;
                            }
                        }
                    });

                    modalInstance.result.then(function (addedFp) {

                        if (addedFp) {
                            $scope.property.floorplans.push(addedFp);
                        }

                        //re-calcualte total units in case we updated unit counts
                        var newTotal = 0;
                        $scope.property.floorplans.forEach(function(f) {
                            newTotal += parseInt(f.units);
                        })

                        $scope.property.totalUnits = newTotal;

                        toastr.success('Floor Plan ' + (fp == null ? 'created' : 'updated')+  ' successfully.');
                    }, function () {
                        //Cancel
                    });
                });
            }

            $scope.save = function() {
                ngProgress.start();
                $('#propertySave').prop("disabled",true);

                var newProp = $scope.getPropertyForSave();

                if (!id) {
                    $propertyService.create(newProp).then(function(response) {

                        if (response.data.errors) {
                            toastr.error(_.pluck(response.data.errors,'msg').join("<br>"));
                        }
                        else {
                            toastr.success($scope.property.name + ' created successfully');

                            //if we're adding a comp, link it to the subject before we return
                            if (isComp) {
                                $propertyService.linkComp(subjectid, response.data.property._id).then(
                                    function(response) {

                                        $modalInstance.close(response.data.property);
                                    },
                                    function(response) {

                                        $modalInstance.close(response.data.property);
                                    }
                                )

                            }
                            else {
                                //not a comp, but a subject being added
                                $modalInstance.close(response.data.property);
                            }
                        }

                        ngProgress.complete();
                        $('#propertySave').prop("disabled",false);
                    }, function(response) {
                        toastr.error('Unable to create property. Please contact an administrator');
                        ngProgress.complete();
                        $('#propertySave').prop("disabled",false);

                    })
                } else {
                    newProp._id = $scope.property._id;
                    $propertyService.update(newProp).then(function(response) {

                        if (response.data.errors) {
                            toastr.error(_.pluck(response.data.errors,'msg').join("<br>"));
                        }
                        else {
                            toastr.success($scope.property.name + ' updated successfully');

                            $modalInstance.close(response.data.property);
                        }

                        ngProgress.complete();
                        $('#propertySave').prop("disabled",false);
                    }, function(response) {
                        toastr.error('Unable to update property. Please contact an administrator');
                        ngProgress.complete();
                        $('#propertySave').prop("disabled",false);

                    })
                }
            }

            //format nicely to save to the service
            $scope.getPropertyForSave = function() {
                var prop = _.cloneDeep($scope.property);
                prop.state = prop.state ? prop.state.abbreviation : '';

                if (prop.orgid) {
                    if (prop.orgid._id) {
                        prop.orgid = prop.orgid._id;
                    } else {
                        delete prop.orgid;
                    }
                } else {
                    delete prop.orgid;
                }

                //extract names for all amenities since the service wants names
                prop.location_amenities = [];
                $scope.locationItems.forEach(function(a) {
                    if (a.selected === true) {
                        if (a.group) {
                            prop.location_amenities.push(a.group + " - " + a.name);
                        } else {
                            prop.location_amenities.push(a.name);
                        }
                    }
                })

                prop.community_amenities = [];
                $scope.communityItems.forEach(function(a) {
                    if (a.selected === true) {
                        if (a.group) {
                            prop.community_amenities.push(a.group + " - " + a.name);
                        } else {
                            prop.community_amenities.push(a.name);
                        }
                    }
                })

                prop.floorplans.forEach(function(fp) {
                    var anames = [];
                    fp.amenities.forEach(function(a){
                        var ua = _.find($scope.unitItems, function(x) {return x.id == a})
                        if (ua.group) {
                            anames.push(ua.group + " - " + ua.name);
                        } else {
                            anames.push(ua.name);
                        }
                    })

                    fp.amenities = anames;
                })

                return prop;
            }
        }]);

});