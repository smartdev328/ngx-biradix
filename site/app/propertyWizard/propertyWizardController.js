'use strict';
define([
    'app',
    '../../components/inputmask/module.js',
    '../../components/filterlist/module.js',
    'async!//maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&libraries=places'
], function (app) {
     app.controller
        ('propertyWizardController', ['$scope', '$modalInstance', 'id', 'isComp', 'ngProgress', '$rootScope','toastr', '$location', '$propertyService', function ($scope, $modalInstance, id, isComp, ngProgress, $rootScope, toastr, $location, $propertyService) {

            if (!$rootScope.loggedIn) {
                $location.path('/login')
            }

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };


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
                $scope.stepTemplate = '/app/propertyWizard/tabs/' + $scope.steps[i].template;

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
                    $propertyService.search({limit: 1, permission: 'PropertyManage', _id: id
                        , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated phone contactName contactEmail notes fees orgid floorplans totalUnits community_amenities location_amenities"
                    }).then(function (response) {
                        $scope.property = response.data.properties[0];
                        $scope.localLoading = true;

                        $scope.property.state = $scope.getSelectedState($scope.property.state)

                        $scope.property.orgid = $scope.getSelectedOrg($scope.property.orgid)

                        $scope.property.floorplans = $scope.property.floorplans || [];

                        $scope.property.averageSqft = 0
                        if ($scope.property.floorplans.length > 0) {
                            $scope.property.floorplans.forEach(function (fp) {
                                $scope.property.averageSqft += fp.sqft;
                            })

                            $scope.property.averageSqft /= $scope.property.floorplans.length;
                        }

                        ($scope.property.community_amenities || []).forEach(function(pa) {
                            var am = _.find($scope.communityItems, function(a) {
                                return a.id.toString() == pa.toString()});
                            if (am) {
                                am.selected = true;
                            }
                        })

                        ($scope.property.location_amenities || []).forEach(function(pa) {
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
                }
            });

            $scope.placeToAddress = function(place) {
                if (place.formatted_phone_number) {
                    $scope.property.phone = place.formatted_phone_number;
                }

                if (place.address_components) {
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
                                $scope.property.state = c.short_name;
                                break;
                        }
                    })
                }


                $scope.property.state = $scope.getSelectedState($scope.property.state)
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
        }]);

});