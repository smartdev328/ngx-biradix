function getReferringUrl(appendDomain) {
    var s = location.href;

    if (appendDomain) {
        if (s.indexOf("?") > -1) {
            s += "&d=%d%";
        } else {
            s += "?d=%d%";
        }
    }

    return encodeURIComponent(s);
}

function redirect(strDomain) {
    window.parent.location.href="https://" + strDomain + "/#/login?r=" + getReferringUrl(false);
}

function redirectDomain() {
    window.parent.location.href="https://platform.biradix.com/#/sso?r=" + getReferringUrl(true);
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

var createCookie = function(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
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

var strDomain = getParameterByName("d") || getCookie("d");

if (getParameterByName("d")) {
    createCookie("d", strDomain, 365);
}

if (strDomain) {
    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var eventer = window[eventMethod];
    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

    // Listen to message from child window
        eventer(messageEvent, function(e) {
            if (e.data === "redirect") {
                redirect(strDomain);
            }
            if (e.data === "success") {
                if (location.href.indexOf("?") > -1) {
                    location.href = location.href.split("?")[0];
                } else {
                    $(".page").show();
                }
            }
        }, false);
    
        $(document).ready(function() {
            $("body").append("<iframe style='width:0; height:0; border:0; border:none' src='https://" + strDomain + "/lock/lock.html?bust=" + (new Date()).getTime() + "></iframe>");
        });
} else {
    redirectDomain();
}

