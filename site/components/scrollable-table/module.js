angular.module("biradix.global").directive('fixedTable', fixedTable);

fixedTable.$inject = ['$timeout'];

function fixedTable($timeout) {
    return {
        restrict: 'A',
        link: link,
        scope: {
            toggles: '=',
        }
    };

    function link($scope, $elem, $attrs, $ctrl) {
        var elem = $elem[0];

        $scope.$watchGroup(['toggles.showBulkConcessions','toggles.showDetailed'], function(isTableDataLoaded) {
            if (isTableDataLoaded) {
                transformTable();
            }
        });

        function transformTable() {
            // reset display styles so column widths are correct when measured below
            angular.element(elem.querySelectorAll('thead, tbody')).css('display', '');

            // wrap in $timeout to give table a chance to finish rendering
            $timeout(function () {
                // set widths of columns
                var columnWidthArray = [27,52,78,56,56,91,91,91,92,55];
                var headerArray = [];
                var BodyArray = [];
                var FooterArray = [];
                var thDesc = elem.querySelector('thead tr:first-child th.description');
                var tdDesc = elem.querySelector('tbody tr:first-child td.description');
                var tfDesc = document.querySelector('.tfoot > .tfoot-cell.description');

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
                    item.style.width = columnWidthArray[i] + 'px';
                });
                FooterArray.forEach(function(item, i){
                    item.style.width = columnWidthArray[i] + 'px';
                });

                if(!$scope.toggles.showBulkConcessions) {
                    thDesc.style.width = parseInt(thDesc.style.width.replace(/\D/g,'')) + columnWidthArray[0] + 'px';
                    tdDesc.style.width = parseInt(tdDesc.style.width.replace(/\D/g,'')) + columnWidthArray[0] + 'px';
                    tfDesc.style.width = parseInt(tfDesc.style.width.replace(/\D/g,'')) + columnWidthArray[0] + 'px';
                }

                if(!$scope.toggles.showDetailed) {
                    thDesc.style.width = parseInt(thDesc.style.width.replace(/\D/g,'')) + columnWidthArray[5] + 'px';
                    tdDesc.style.width = parseInt(tdDesc.style.width.replace(/\D/g,'')) + columnWidthArray[5] + 'px';
                    tfDesc.style.width = parseInt(tfDesc.style.width.replace(/\D/g,'')) + columnWidthArray[5] + 'px';
                }

                // set css styles on thead and tbody
                angular.element(elem.querySelectorAll('thead')).css('display', 'block');

                angular.element(elem.querySelectorAll('tbody')).css({
                    'display': 'block',
                    'height': $attrs.tableHeight || 'inherit',
                    'overflow': 'auto'
                });

            });
        }
    }
}