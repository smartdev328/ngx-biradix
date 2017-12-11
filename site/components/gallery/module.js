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


            $scope.$watch("options.show", function() {
                $scope.index = 0;
            }, true)

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

                var scroll = 105 * (i - 1.5);

                if (scroll < 0) {
                    scroll = 0;
                }

                $(".gallery-overlay .thumbs").animate({scrollLeft: scroll}, 800);
            }
        },
        templateUrl: '/components/gallery/template.html?bust=' + version
    }
})