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
                    $scope.select(0);
                } else {
                    $scope.select($scope.index + 1);
                }
            }

            $scope.select = function(i) {
                $scope.index = i;


                $(".gallery-overlay .thumbs").animate({scrollLeft: 105 * i}, 800);
            }
        },
        templateUrl: '/components/gallery/template.html?bust=' + version
    }
})