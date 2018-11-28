function getReferringUrl() {
    var s = location.href;

    if (s.indexOf("?") > -1) {
        s += "&d=%d%";
    } else {
        s += "?d=%d%";
    }

    return encodeURIComponent(s);
}

function redirect(strDomain) {
    window.parent.location.href="https://" + strDomain + "/#/login?r=" + getReferringUrl();
}

function redirectDomain() {
    window.parent.location.href="https://platform.biradix.com/#/sso?r=" + getReferringUrl();
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

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}

var strDomain = getParameterByName("d") || getCookie('d');

if (strDomain) {
    createCookie("d", strDomain, 365);
    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var eventer = window[eventMethod];
    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

    // Listen to message from child window
        eventer(messageEvent, function(e) {
            if (e.data === "redirect") {
                redirect(strDomain);
            }
            if (e.data === "success") {
                $(".page").show();
            }
        },false);
    
        $(document).ready(function() {
            $("body").append("<iframe src='https://" + strDomain + "/lock/lock.html?'></iframe>");
        });

} else {
    redirectDomain();
}

