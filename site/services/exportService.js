angular.module("biradix.global").factory('$exportService', ['$http','$cookies','$urlService', '$timeout', function ($http,$cookies,$urlService, $timeout) {
    var fac = {};


    var getPdfUrl = function(showFile,propertyId,graphs, daterange, progressId, perspective) {
        var timezone = moment().utcOffset();
        if ($cookies.get("timezone")) {
            timezone = parseInt($cookies.get("timezone"));
        }

        var url = gAPI + '/api/1.0/properties/' + propertyId + '/pdf?';
        var data = {
            Graphs: graphs,
            Scale: $cookies.get('Scale') || "ner",
            selectedStartDate: daterange.selectedStartDate,
            selectedEndDate: daterange.selectedEndDate,
            selectedRange: daterange.selectedRange,
            timezone: timezone,
            progressId: progressId,
            showFile: showFile,
            orderBy: ($cookies.get("fp.o") || ''),
            show: encodeURIComponent($cookies.get("fp.s") || ''),
            showP: encodeURIComponent($cookies.get("pr.s") || ''),
            referer: location.href,
            perspective: perspective
        };

        return {base:url, data: data};
    };

    fac.print = function (propertyId, showFile, daterange, progressId, graphs, perspective) {
        var pdf = getPdfUrl(true,propertyId, graphs, daterange, progressId, perspective);

        //Has to be synchronous
        var key = $urlService.shorten(JSON.stringify(pdf.data));
        var url = pdf.base + "&key=" + key;

        url += "&bust=" + (new Date()).getTime();

        fac.streamFile(url);
    };

    fac.streamFile = function(url) {

        $http.get(url, {
        headers: {'Authorization': 'Bearer ' + $cookies.get('token') },
        responseType: "arraybuffer"}).success(function (data, status, headers) {

        var blob = new Blob([data], { type: headers()["content-type"] });

        var filename = headers()["x-filename"];

        if (!filename) {
            filename = headers()["content-disposition"].split(";")[1].split("=")[1];
        }
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, filename);
            return;
        }

        var fileURL = URL.createObjectURL(blob);

        var a = document.createElement('a');
        a.href = fileURL;
        a.target = '_blank';
        a.download = filename;
        document.body.appendChild(a); //create the link "a"
        $timeout(function() {
            a.click(); //click the link "a"
            document.body.removeChild(a); //remove the link "a"
        }, 1);
        }).error(function (response) {
        console.error(response);
        });

    };
    return fac;
}]);
