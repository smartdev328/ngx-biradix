var moment = require('moment')
module.exports = {
    convertRangeToParts: function (daterange,offset) {

        daterange = daterange || {daterange:'Last 90 Days'};

        switch (daterange.daterange) {
            case "Today":
                return {start: moment().utc().add(offset,"minute").startOf("day").format(), end: moment().utc().add(offset,"minute").endOf("day").format()}
            case "Week to Date":
                return {start: moment().utc().add(offset,"minute").startOf("week").format(), end: moment().utc().add(offset,"minute").endOf("day").format()}
            case "Month to Date":
                return {start: moment().utc().add(offset,"minute").startOf("month").format(), end: moment().utc().add(offset,"minute").endOf("day").format()}
            case "Last 90 Days":
                return {start: moment().utc().add(offset,"minute").add(-89, "day").format(), end: moment().utc().add(offset,"minute").endOf("day").format()}
            case "Last 30 Days":
                return {start: moment().utc().add(offset,"minute").add(-29, "day").format(), end: moment().utc().add(offset,"minute").endOf("day").format()}
            case "Last 7 Days":
                return {start: moment().utc().add(offset,"minute").add(-7, "day").format(), end: moment().utc().add(offset,"minute").endOf("day").format()}
            case "Last Year":
                return {start: moment().utc().add(offset,"minute").add(-1, "year").format(), end: moment().utc().add(offset,"minute").endOf("day").format()}
            case "Lifetime":
                return {start: moment().utc().add(offset,"minute").add(-30, "year").format(), end: moment().utc().add(offset,"minute").endOf("day").format()}
            default:
                return {start: daterange.start, end: daterange.end}
        }
    }
}