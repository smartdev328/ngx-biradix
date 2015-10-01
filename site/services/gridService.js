'use strict';
define([
    'app',
], function (app) {
    app.factory('$gridService', [function () {
        var fac = {};

        fac.toggle = function (obj, v, reset) {
            var s = obj[v];

            if (reset) {
                for (var i in obj) {
                    if (i != v) {
                        delete obj[i];
                    }
                }
            }

            if (s === true) {
                obj[v] = false
                return;
            }

            if (s === false) {
                obj[v] = null
                return;
            }

            obj[v] = true;

        }

        fac.streamCsv = function (filename, content) {
            var finalVal = '';

            for (var i = 0; i < content.length; i++) {
                var value = content[i];

                for (var j = 0; j < value.length; j++) {
                    var innerValue = value[j];
                    var result = innerValue.replace(/"/g, '""');
                    if (result.search(/("|,|\n)/g) >= 0)
                        result = '"' + result + '"';
                    if (j > 0)
                        finalVal += ',';
                    finalVal += result;
                }

                finalVal += '\n';
            }

            var pom = document.createElement('a');
            pom.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(finalVal));
            pom.setAttribute('download', filename);
            pom.click();
        }

        return fac;
    }]);
});