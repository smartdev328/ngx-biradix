var moment = require('moment')
module.exports = {
    convertRangeToParts: function (daterange) {

        daterange = daterange || {daterange:'Last 90 Days'};

        switch (daterange.daterange) {
            case "Today":
                return {start: moment().startOf("day").format(), end: moment().endOf("day").format()}
            case "Week to Date":
                return {start: moment().startOf("week").format(), end: moment().endOf("day").format()}
            case "Month to Date":
                return {start: moment().startOf("month").format(), end: moment().endOf("day").format()}
            case "Last 90 Days":
                return {start: moment().add(-89, "day").format(), end: moment().endOf("day").format()}
            case "Last 30 Days":
                return {start: moment().add(-29, "day").format(), end: moment().endOf("day").format()}
            case "Last 7 Days":
                return {start: moment().add(-7, "day").format(), end: moment().endOf("day").format()}
            case "Last Year":
                return {start: moment().add(-1, "year").format(), end: moment().endOf("day").format()}
            case "Lifetime":
                return {start: moment().add(-30, "year").format(), end: moment().endOf("day").format()}
            default:
                return {start: daterange.start, end: daterange.end}
        }
    }
}