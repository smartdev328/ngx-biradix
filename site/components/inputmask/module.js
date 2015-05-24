define([
    'app',
    '../../components/inputmask/jquery.inputmask.bundle.min.js'
], function (app) {
    app.directive('inputMask', function () {
        return {
            restrict: 'A',
            link: function ($scope, element, attr) {
                $(element).inputmask({
                    mask:attr.inputMask,
                    definitions: {
                        '*': {
                            validator: "[0-9A-Za-z.!#$%&'*+/=?^_`{|}~\-]",
                            cardinality: 1,
                            casing: "lower"
                        }
                    }
                });
            }
        };
    })
})