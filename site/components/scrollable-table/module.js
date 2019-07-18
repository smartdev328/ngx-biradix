angular.module("biradix.global").directive('fixedTable', fixedTable);

fixedTable.$inject = ['$timeout'];

function fixedTable($timeout) {
    return {
        restrict: 'A',
        link: link,
        scope: {
            toggles: '='
        }
    };

    function link($scope, $elem, $attrs, $ctrl) {
        var elem = $elem[0];
        var columnWidthArray;

        $scope.$watchGroup(['toggles.showBulkConcessions','toggles.showDetailed'], function(isTableDataLoaded) {
            if (isTableDataLoaded) {
                transformTable();
            }
        });

        function calculateWidth() {
            var modal = window.outerWidth - 20;
            if(window.innerWidth < 768) {
                var firstColumn = 27;
                var secondColumn = Math.round(modal*(19/100)) - 18;
                var thirdColumn = Math.round(modal*(27/100)) - 21;
                var fourthColumn = Math.round(modal*(27/100)) - 21;
                var fifthColumn = Math.round(modal*(27/100)) - 22;
                var sixthColumn = 50;
                columnWidthArray = [firstColumn,secondColumn,0,0,0,thirdColumn,fourthColumn,fifthColumn,sixthColumn];
            } else {
                columnWidthArray = [27,50,73,52,52,87,87,87,50];
            }

            var headerArray = [];
            var BodyArray = [];
            var FooterArray = [];
            var thDesc = elem.querySelector('thead tr:first-child th.description');
            var tdDesc = elem.querySelector('tbody tr:first-child td.description');
            var tfDesc = document.querySelector('.tfoot > .tfoot-cell.description');
            var thLast = elem.querySelector('thead tr:first-child th:last-child');
            var tdLast = elem.querySelector('tbody tr:first-child td:last-child');
            var tfLast = document.querySelector('.tfoot > .tfoot-cell:last-child');

            columnWidthArray.forEach(function(width, i){
                var thElems = elem.querySelector('thead tr:first-child th:nth-child(' + (i + 1) + ')');
                var tdElems = elem.querySelector('tbody tr:first-child td:nth-child(' + (i + 1) + ')');
                var tfElems = document.querySelector('.tfoot > .tfoot-cell:nth-child(' + (i + 1) + ')');
                if (thElems) {
                    headerArray.push(thElems);
                }
                if (tdElems) {
                    BodyArray.push(tdElems);
                }
                if (tfElems) {
                    FooterArray.push(tfElems);
                }
            });

            headerArray.forEach(function(item, i){
                item.style.width = columnWidthArray[i] + 'px';
            });
            BodyArray.forEach(function(item, i){
                item.style.minWidth = columnWidthArray[i] + 'px';
            });
            FooterArray.forEach(function(item, i){
                item.style.width = columnWidthArray[i] + 'px';
            });

            if(!$scope.toggles.showBulkConcessions) {
                thDesc.style.width = parseInt(thDesc.style.width.replace(/\D/g,'')) + columnWidthArray[0] + 'px';
                tdDesc.style.minWidth = parseInt(tdDesc.style.minWidth.replace(/\D/g,'')) + columnWidthArray[0] + 'px';
                tfDesc.style.width = parseInt(tfDesc.style.width.replace(/\D/g,'')) + columnWidthArray[0] + 'px';
            }

            if(!$scope.toggles.showDetailed) {
                thDesc.style.width = parseInt(thDesc.style.width.replace(/\D/g,'')) + columnWidthArray[5] + 'px';
                tdDesc.style.minWidth = parseInt(tdDesc.style.minWidth.replace(/\D/g,'')) + columnWidthArray[5] + 'px';
                tfDesc.style.width = parseInt(tfDesc.style.width.replace(/\D/g,'')) + columnWidthArray[5] + 'px';
                thLast.style.width = columnWidthArray[8] + 'px';
                tdLast.style.minWidth = columnWidthArray[8] + 'px';
                tfLast.style.width = columnWidthArray[8] + 'px';
            }
        }

        function transformTable() {
            // reset display styles so column widths are correct when measured below
            angular.element(elem.querySelectorAll('thead, tbody')).css('display', '');

            // wrap in $timeout to give table a chance to finish rendering
            $timeout(function () {

                angular.element(window).bind('resize', function(){
                    calculateWidth();
                });

                calculateWidth();

                // set css styles on thead and tbody
                angular.element(elem.querySelectorAll('thead')).css('display', 'block');

                angular.element(elem.querySelectorAll('tbody')).css({
                    'display': 'block',
                    'height': $attrs.tableHeight || 'inherit',
                    'overflow-y': 'auto',
                    'overflow-x': 'hidden'
                });

            });
        }
    }
}

angular.module('biradix.global').directive('fixedTableNoFooter', ['$timeout', function ($timeout) {
    return {
        restrict: 'A',
        link: link,
        scope: {
            toggles: '='
        }
    };

    function link($scope, $elem, $attrs, $ctrl) {
        var elem = $elem[0];
        var columnWidthArray;

        transformTable();

        function calculateWidth() {
            var modal = window.outerWidth;
            if(window.innerWidth < 768) {
                var firstColumn = Math.round(modal*(10/100));
                var secondColumn = Math.round(modal*(10/100));
                var thirdColumn = Math.round(modal*(30/100));
                var fourthColumn = Math.round(modal*(10/100));
                var fifthColumn = Math.round(modal*(10/100));
                var sixthColumn = Math.round(modal*(10/100));
                columnWidthArray = [firstColumn,secondColumn,thirdColumn,fourthColumn,fifthColumn,sixthColumn];
            } else {
                columnWidthArray = [80,80,200,80,80,44];
            }

            columnWidthArray.forEach(function(width, i){
                var thElems = elem.querySelector('thead tr th:nth-child(' + (i + 1) + ')');
                var tdElems = elem.querySelector('tbody tr:first-child td:nth-child(' + (i + 1) + ')');
                if (thElems) {
                    thElems.style.width = columnWidthArray[i] + 'px';
                }
                if (tdElems) {
                    tdElems.style.width = columnWidthArray[i] + 'px';
                }
            });
        }

        function transformTable() {
            // reset display styles so column widths are correct when measured below
            angular.element(elem.querySelectorAll('thead, tbody')).css('display', '');

            // wrap in $timeout to give table a chance to finish rendering
            $timeout(function () {

                angular.element(window).bind('resize', function(){
                    calculateWidth();
                });

                calculateWidth();

                // set css styles on thead and tbody
                angular.element(elem.querySelectorAll('thead')).css('display', 'block');

                angular.element(elem.querySelectorAll('tbody')).css({
                    'display': 'block',
                    'height': $attrs.tableHeight || 'inherit',
                    'overflow-y': 'auto',
                    'overflow-x': 'hidden'
                });

            });
        }
    }
}]);