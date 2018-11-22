console.log(window.location, window.parent.location, document.referrer);
var token = getCookie("token");

if (!token) {
    parent.postMessage("redirect", "http://testspace.biradix.com.s3-website-us-east-1.amazonaws.com");
} else {
    $.ajax({
        url: '/api/1.0/users/me' + '?bust=' + (new Date()).getTime(),
        type: 'GET',
        dataType: 'json',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        contentType: 'application/json; charset=utf-8',
        success: function (result) {
            parent.postMessage("success", "http://testspace.biradix.com.s3-website-us-east-1.amazonaws.com");
        },
        error: function (error) {
            parent.postMessage("redirect", "http://testspace.biradix.com.s3-website-us-east-1.amazonaws.com");
        }
    });
}

function getCookie(name) {
    var dc = document.cookie;
    var prefix = name + "=";
    var begin = dc.indexOf("; " + prefix);
    if (begin == -1) {
        begin = dc.indexOf(prefix);
        if (begin != 0) return null;
    } else {
        begin += 2;
        var end = document.cookie.indexOf(";", begin);
        if (end == -1) {
            end = dc.length;
        }
    }
    return decodeURI(dc.substring(begin + prefix.length, end));
}
