angular.module('biradix.global').directive('googleMap', function () {
        return {
            restrict: 'E',
            scope: {
                options: '='
            },
            controller: function ($scope, $element, $rootScope) {

                $scope.phantom = phantom;
                $scope.$watch('options', function(){
                    $scope.done = false;
                    if ($scope.options) {
                        delete $scope.error;

                        // if (!phantom) {
                            $scope.error = typeof google === 'undefined';
                            if ($scope.error) {
                                global_error({stack: 'Google maps not available, showing static map'}, {location: location.href});
                            }
                        // }

                        $scope.options.points = $scope.options.points || [];

                        if (!$scope.error) {
                            if ($scope.aMarkers) {
                                for (var i = 0; i < $scope.aMarkers.length; i++) {
                                    google.maps.event.removeListener($scope.aMarkers[i].handle);
                                }
                            }
                            $scope.aMarkers = [];

                            var mapOptions = {
                                zoom: 14,
                                center: new google.maps.LatLng($scope.options.loc[0], $scope.options.loc[1]),
                                mapTypeId: google.maps.MapTypeId.ROADMAP,
                                disableDefaultUI: true,
                                fullscreenControl: !phantom
                            };

                            var elMap = $($element).find('div')[0];
                            $scope.oMap = new google.maps.Map(elMap, mapOptions);

                            $scope.loadMarkers();


                            $(elMap).width($scope.options.width);
                            $(elMap).height($scope.options.height + "px");

                            // window.setTimeout(function () {
                            //     $scope.resize(1);
                            // }, 100);

                            $scope.oMap.addListener('zoom_changed', function() {
                                if (!$scope.done) {
                                    window.setTimeout(function() {
                                        $rootScope.$broadcast('timeseriesLoaded');
                                    }, 500);

                                    $scope.done = true;
                                }
                            });
                        } else {
                            $rootScope.$broadcast('timeseriesLoaded');
                            $scope.done = true;
                        }

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
                    var bounds = new google.maps.LatLngBounds();
                    for (var i = 0; i < $scope.options.points.length; i++) {
                        var oPoint = $scope.options.points[i];
                        $scope.aMarkers[i] = new google.maps.Marker({
                            map: $scope.oMap,
                            position: new google.maps.LatLng(oPoint.loc[0], oPoint.loc[1]),
                            icon: "/components/googleMap/markers/" + oPoint.marker + ".png",
                            clickable: true,
                            title: oPoint.Name,
                            info: new google.maps.InfoWindow({
                                content: oPoint.content,
                            }),
                        });

                        $scope.aMarkers[i].handle = google.maps.event.addListener($scope.aMarkers[i], 'click', function () {
                            $scope.closeAllInfoBoxes();
                            this.info.open($scope.oMap, this);
                        });

                        bounds.extend($scope.aMarkers[i].position);
                    }

                    if ($scope.aMarkers.length > 1) {
                        $scope.oMap.fitBounds(bounds);


                        window.setTimeout(function () {
                            $scope.oMap.fitBounds(bounds);
                        }, 1000);
                    }
                };
            },
            template: "<div></div>"
        };
    })
