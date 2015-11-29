'use strict';
define([
    'app',
], function (app) {
    app.factory('$exportService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        var getPdfUrl = function(full, showFile,propertyId,graphs, daterange, progressId) {
            var url = '/api/1.0/properties/' + propertyId + '/pdf?'
            url += "token=" + $cookies.get('token')
            url += "&Graphs=" + graphs
            url += "&selectedStartDate=" + daterange.selectedStartDate.format()
            url += "&selectedEndDate=" + daterange.selectedEndDate.format()
            url += "&selectedRange=" + daterange.selectedRange
            url += "&timezone=" + moment().utcOffset()
            url += "&progressId=" + progressId
            url += "&full=" + full
            url += "&showFile=" + showFile
            url += "&orderBy=" + ($cookies.get("fp.o") || '');
            url += "&show=" + encodeURIComponent ($cookies.get("fp.s") || '')
            url += "&orderByC=" + ($cookies.get("cmp.o") || '');
            url += "&showC=" + encodeURIComponent ($cookies.get("cmp.s") || '') ;
            url += "&showP=" + encodeURIComponent ($cookies.get("pr.s") || '') ;
            url += '&bust=' + (new Date()).getTime();
            return url;
        }

        fac.print = function (propertyId, full, showFile, daterange, progressId, graphs) {
            var url = getPdfUrl(full, showFile,propertyId, graphs, daterange, progressId);

            if (showFile === true) {
                location.href = url;
            }
            else {
                window.open(url);
            }
        }

        return fac;
    }]);
});