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
                        var mapOptions = {
                            zoom: $scope.options.zoom,
                            center: new google.maps.LatLng($scope.options.loc[0], $scope.options.loc[1]),
                            mapTypeId: google.maps.MapTypeId.ROADMAP
                        }
                        var elMap = $($element).find('div')[0]
                        $(elMap).width($scope.options.width);
                        $(elMap).height($scope.options.height);
                        $scope.oMap = new google.maps.Map(elMap, mapOptions);
                    }

                });



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
