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

    var cookie = (decodeURI(dc.substring(begin + prefix.length, end)) || "").split(";")[0];

    return cookie;
}

var token = getCookie("token");

if (!token) {
    parent.postMessage("redirect", document.referrer);
} else {
    $.ajax({
        url: 'https://api.biradix.com/api/1.0/users/me?bust=' + (new Date()).getTime(),
        type: 'GET',
        dataType: 'json',
        headers: {
            'Authorization': 'Bearer ' + token
        },
        contentType: 'application/json; charset=utf-8',
        success: function (result) {
            parent.postMessage("success", document.referrer);
        },
        error: function (error) {
            parent.postMessage("redirect", document.referrer);
        }
    });
}


