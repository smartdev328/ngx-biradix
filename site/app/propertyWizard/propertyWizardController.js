'use strict';
define([
    'app',
    '../../components/inputmask/module.js',
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

            $scope.getTitle = function() {
                var title = "";
                if (!id && isComp) {
                    title = "Create Comp"
                } else {
                    title = "Create Property"
                }

                if ($scope.property.name) {
                    title += ": " + $scope.property.name;
                }

                return title;
            }


            $scope.steps = [
                {label:'Property Info', template: 'propertyInfo.html'},
                {label:'Property Amenities', template: 'amenities.html'},
                {label:'Fees & Deposits', template: 'feesDeposits.html'},
                {label:'Floor Plans', template: 'floorPlans.html'},
                {label:'Notes', template: 'notes.html'},
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
            $scope.property = { }

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


            $scope.load = function() {
                var autocomplete2 = new google.maps.places.Autocomplete(
                    (document.getElementById('autocomplete2'))
                    ,{ types: ['geocode'], componentRestrictions: {country:'us'} }
                );

                google.maps.event.addListener(autocomplete2, 'place_changed', function () {
                    var place = autocomplete.getPlace();


                    $scope.property.phone = place.formatted_phone_number;

                    place.address_components.forEach(function(c) {
                        switch(c.types[0]) {
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

                    $scope.states.forEach(function(s) {
                        if (s.abbreviation == $scope.property.state) {
                            $scope.property.state = s;
                        }
                    })

                    var address = _.cloneDeep($scope.property.address);

                    $('#autocomplete2').on("blur", function() {
                        window.setTimeout(function() {
                            $('#autocomplete2').val(address)
                        }, 100)
                        $('#autocomplete2').off("blur");
                    })
                });

                var autocomplete = new google.maps.places.Autocomplete(
                    (document.getElementById('autocomplete'))
                    ,{ componentRestrictions: {country:'us'} }
                );

                google.maps.event.addListener(autocomplete, 'place_changed', function () {
                    var place = autocomplete.getPlace();


                    $('#autocomplete').on("blur", function() {
                        window.setTimeout(function() {
                            $('#autocomplete').val(place.name)
                        }, 100)
                        $('#autocomplete').off("blur");
                    })

                    $scope.property.name=place.name;
                    $scope.property.phone = place.formatted_phone_number;

                    place.address_components.forEach(function(c) {
                        switch(c.types[0]) {
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

                    $scope.states.forEach(function(s) {
                        if (s.abbreviation == $scope.property.state) {
                            $scope.property.state = s;
                        }
                    })
                });
            }
        }]);

});