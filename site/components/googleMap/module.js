'use strict';
define([
    'app',
    phantom ? 'empty' : 'async!//maps.googleapis.com/maps/api/js?v=3.exp&libraries=places'
], function (app) {
    app.directive('googleMap', function () {
        return {
            restrict: 'E',
            scope: {
                options: '='
            },
            controller: function ($scope, $element) {

                $scope.phantom = phantom;

                $scope.distance = function(p1, p2)
                {
                    var e = (3.1415926538 * p1[0] / 180);
                    var f = (3.1415926538 * p1[1] / 180);
                    var g = (3.1415926538 * p2[0] / 180);
                    var h = (3.1415926538 * p2[1] / 180);
                    var i = (Math.cos(e) * Math.cos(g) * Math.cos(f) * Math.cos(h) + Math.cos(e) * Math.sin(f) * Math.cos(g) * Math.sin(h) + Math.sin(e) * Math.sin(g));
                    var j = (Math.acos(i));
                    var k = (6371 * j);

                    return k;
                }

                $scope.getZoom = function(points) {

                    var MaxMiles = 0;

                    for (var i = 1; i < points.length; i++ ) {
                        var dist = $scope.distance(points[0].loc, points[i].loc);

                        if (dist > MaxMiles) {
                            MaxMiles = dist;
                        }
                    }

                    if (MaxMiles > 1600)
                    {
                        return 2;
                    }
                    else
                    if (MaxMiles > 800)
                    {
                        return 3;
                    }
                    else
                    if (MaxMiles > 400)
                    {
                        return 4;
                    }
                    else
                    if (MaxMiles > 200)
                    {
                        return 5;
                    }
                    else
                    if (MaxMiles > 100)
                    {
                        return 6;
                    }
                    else
                    if (MaxMiles > 50)
                    {
                        return 7;
                    }
                    else
                    if (MaxMiles > 25)
                    {
                        return 8;
                    }
                    else
                    if (MaxMiles > 12)
                    {
                        return 9;
                    }
                    else
                    if (MaxMiles > 6)
                    {
                        return 10;
                    }
                    else
                    if (MaxMiles > 4)
                    {
                        return 11;
                    }
                    else
                    {
                        return 12;
                    }

                }

                $scope.$watch('options', function(){

                    if ($scope.options) {
                        $scope.options.points = $scope.options.points || [];

                        $scope.staticUrl = "https://maps.googleapis.com/maps/api/staticmap?center=" + $scope.options.loc[0]
                            + "," + $scope.options.loc[1]
                            + "&zoom=" + $scope.getZoom($scope.options.points)
                            + "&size=" + $scope.options.printWidth + "x" + $scope.options.height

                        $scope.options.points.forEach(function(p) {
                            $scope.staticUrl += "&markers=icon:https://biradixplatform-prod.herokuapp.com/components/googleMap/markers/" + p.marker + ".png%7C" + p.loc[0] + "," + p.loc[1];
                        })

                        if ($scope.aMarkers) {

                            for (var i = 0; i < $scope.aMarkers.length; i++) {
                                google.maps.event.removeListener($scope.aMarkers[i].handle);
                            }
                        }
                        $scope.aMarkers = [];

                        var mapOptions = {
                            zoom: $scope.getZoom($scope.options.points),
                            center: new google.maps.LatLng($scope.options.loc[0], $scope.options.loc[1]),
                            mapTypeId: google.maps.MapTypeId.ROADMAP
                        }
                        var elMap = $($element).find('div')[0]
                        $scope.oMap = new google.maps.Map(elMap, mapOptions);

                        $scope.loadMarkers();


                        $(elMap).width($scope.options.width);
                        $(elMap).height($scope.options.height + "px");

                        window.setTimeout(function () {
                            $scope.resize(1)
                        }, 100);

                        $scope.gLoaded = true;
                    }

                });

                $scope.closeAllInfoBoxes = function() {
                    for (var i = 0; i < $scope.aMarkers.length; i++) {
                        if ($scope.aMarkers[i] != null) {
                            $scope.aMarkers[i].info.close();
                        }
                    }
                }

                $scope.loadMarkers = function() {
                    for (var i = 0; i < $scope.options.points.length; i++) {
                        var oPoint = $scope.options.points[i];
                        $scope.aMarkers[i] = new google.maps.Marker({
                            map: $scope.oMap,
                            position: new google.maps.LatLng(oPoint.loc[0], oPoint.loc[1]),
                            icon: "/components/googleMap/markers/" + oPoint.marker + ".png",
                            clickable: true,
                            title: oPoint.Name,
                            info: new google.maps.InfoWindow({
                                content: oPoint.content
                            })

                        });

                        $scope.aMarkers[i].handle = google.maps.event.addListener($scope.aMarkers[i], 'click', function () {
                            $scope.closeAllInfoBoxes();
                            this.info.open($scope.oMap, this);
                        });
                    }
                }

                $scope.resize = function() {
                    var currCenter = $scope.oMap.getCenter();
                    google.maps.event.trigger($scope.oMap, 'resize');
                    $scope.oMap.setCenter(currCenter);
                }


            },
            templateUrl: '/components/googleMap/googleMap.html'
        };
    })
})
