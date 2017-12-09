angular.module('biradix.global').directive('gallery', function () {
    return {
        restrict: 'E',
        scope: {
            options: '=',
            images: '=',
        },
        link: function() {
            $(document.body).append($('.gallery-overlay').detach());
        },
        controller: function ($scope, $element,toastr) {
            $scope.index = 0;

            $scope.closeView = function() {
                $scope.options.show = false;
            }

            $scope.next = function() {
                if ($scope.index >= $scope.images.length - 1) {
                    $scope.index = 0;
                } else {
                    $scope.index ++;
                }
            }
        },
        templateUrl: '/components/gallery/template.html?bust=' + version
    }
})