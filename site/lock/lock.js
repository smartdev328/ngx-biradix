console.log(getCookie("token"));
var token = getCookie("token");

var loggedIn = false;

if (token) {
    loggedIn = true;
}

if (!loggedIn) {
    window.parent.location.href="https://biradixplatform-qa-pr-217.herokuapp.com";
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
