angular.module("biradix.global").directive("googleMap", function () {
        return {
            restrict: "E",
            scope: {
                options: "="
            },
            controller: function ($scope, $element, $rootScope) {

                $scope.phantom = phantom;
                $scope.$watch("options", function() {
                    if ($scope.options) {
                        delete $scope.error;

                        // if (!phantom) {
                            $scope.error = typeof google === "undefined";
                            if ($scope.error) {
                                global_error({stack: "Google maps not available, showing static map"}, {location: location.href});
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

                            var elMap = $($element).find("div")[0];
                            $scope.oMap = new google.maps.Map(elMap, mapOptions);

                            $scope.loadMarkers();

                            $(elMap).width($scope.options.width);
                            $(elMap).height($scope.options.height + "px");

                            google.maps.event.addListenerOnce($scope.oMap, "idle", function() {
                                // do something only the first time the map is loaded
                                $rootScope.$broadcast("timeseriesLoaded");
                            });
                        } else {
                            $rootScope.$broadcast("timeseriesLoaded");
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
                            zIndex: 100 - i,
                        });

                        $scope.aMarkers[i].handle = google.maps.event.addListener($scope.aMarkers[i], "click", function () {
                            $scope.closeAllInfoBoxes();
                            this.info.open($scope.oMap, this);
                        });

                        bounds.extend($scope.aMarkers[i].position);
                    }

                    if ($scope.aMarkers.length > 1) {
                        $scope.oMap.fitBounds(bounds);
                    }
                };
            },
            template: "<div></div>"
        };
    })
