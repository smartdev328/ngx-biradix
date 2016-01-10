var moment = require('moment')
module.exports = {
    isAllowed: function (cron) {

        var ar = cron.split(" ");

        if (ar.length == 5) {

            if (!isNaN(ar[4])) {
                if (ar[4] == moment().format("d")) {
                    return true;
                }
            } else if (ar[2] != "*") {
                if (ar[2] == moment().format("D")) {
                    return true;
                }

                if (ar[2] == "L" && moment().format("D") == moment().endOf('month').format("D")) {
                    return true;
                }
            }
        }
        return false;
    }
}