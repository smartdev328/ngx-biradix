var moment = require('moment')
module.exports = {
    convertRangeToParts: function (daterange) {
        switch (daterange.daterange) {
            case "Today":
                return {start: moment().startOf("day").format(), end: moment().format()}
            case "Week to Date":
                return {start: moment().startOf("week").format(), end: moment().format()}
            case "Month to Date":
                return {start: moment().startOf("month").format(), end: moment().format()}
            case "Last 90 Days":
                return {start: moment().add(-89, "day").format(), end: moment().format()}
            case "Last 30 Days":
                return {start: moment().add(-29, "day").format(), end: moment().format()}
            case "Last 7 Days":
                return {start: moment().add(-7, "day").format(), end: moment().format()}
            case "Last Year":
                return {start: moment().add(-1, "year").format(), end: moment().format()}
            case "Lifetime":
                return {start: moment().add(-30, "year").format(), end: moment().startOf("day").format()}
            default:
                return {start: daterange.start, end: daterange.end}
        }
    }
}