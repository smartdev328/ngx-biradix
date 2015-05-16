'use strict';
define([
    'app',
    'async!//maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&libraries=places'
], function (app) {
    app.directive('googleMap', function () {
        return {
            restrict: 'E',
            scope: {
                options: '='
            },
            controller: function ($scope, $element) {

                $scope.$watch('options', function(){

                    if ($scope.options) {

                        if ($scope.aMarkers) {

                            for (var i = 0; i < $scope.aMarkers.length; i++) {
                                google.maps.event.removeListener($scope.aMarkers[i].handle);
                            }
                        }
                        $scope.aMarkers = [];

                        var mapOptions = {
                            zoom: $scope.options.zoom,
                            center: new google.maps.LatLng($scope.options.loc[0], $scope.options.loc[1]),
                            mapTypeId: google.maps.MapTypeId.ROADMAP
                        }
                        var elMap = $($element).find('div')[0]
                        $scope.oMap = new google.maps.Map(elMap, mapOptions);
                        $scope.options.points = $scope.options.points || [];
                        $scope.loadMarkers();
                        $scope.gLoaded = true;

                        $(elMap).width($scope.options.width);
                        $(elMap).height($scope.options.height);

                        window.setTimeout(function() {$scope.resize(1)}, 100);
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
