var token = getCookie("token");

if (!token) {
    redirect();
}

$.ajax({
    url: '/api/1.0/users/me'+ '?bust=' + (new Date()).getTime(),
    type: 'GET',
    dataType: 'json',
    headers: {
        'Authorization': 'Bearer ' + token
    },
    contentType: 'application/json; charset=utf-8',
    success: function (result) {

    },
    error: function (error) {
        redirect();
    }
});

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
