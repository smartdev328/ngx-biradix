var moment = require('moment')
module.exports = {
    convertRangeToParts: function (daterange,offset) {

        daterange = daterange || {daterange:'90 Days'};

        switch (daterange.daterange) {
            case "Today":
                return {start: moment().utc().add(offset,"minute").startOf("day").subtract(offset,"minute").format(), end: moment().utc().add(offset,"minute").endOf("day").subtract(offset,"minute").format()}
            case "Week to Date":
                return {start: moment().utc().add(offset,"minute").startOf("week").subtract(offset,"minute").format(), end: moment().utc().add(offset,"minute").endOf("day").subtract(offset,"minute").format()}
            case "Month to Date":
                return {start: moment().utc().add(offset,"minute").startOf("month").subtract(offset,"minute").format(), end: moment().utc().add(offset,"minute").endOf("day").subtract(offset,"minute").format()}
            case "Year to Date":
                return {start: moment().utc().add(offset,"minute").startOf("year").subtract(offset,"minute").format(), end: moment().utc().add(offset,"minute").endOf("day").subtract(offset,"minute").format()}
            case "90 Days":
                return {start: moment().utc().add(offset,"minute").add(-90, "day").startOf("day").subtract(offset,"minute").format(), end: moment().utc().add(offset,"minute").endOf("day").subtract(offset,"minute").format()}
            case "30 Days":
                return {start: moment().utc().add(offset,"minute").add(-30, "day").startOf("day").subtract(offset,"minute").format(), end: moment().utc().add(offset,"minute").endOf("day").subtract(offset,"minute").format()}
            case "Last 7 Days":
                return {start: moment().utc().add(offset,"minute").add(-7, "day").startOf("day").subtract(offset,"minute").format(), end: moment().utc().add(offset,"minute").endOf("day").subtract(offset,"minute").format()}
            case "12 Months":
                return {start: moment().utc().add(offset,"minute").add(-1, "year").startOf("day").subtract(offset,"minute").format(), end: moment().utc().add(offset,"minute").endOf("day").subtract(offset,"minute").format()}
            case "Lifetime":
                return {start: moment().utc().add(offset,"minute").add(-30, "year").startOf("day").subtract(offset,"minute").format(), end: moment().utc().add(offset,"minute").endOf("day").subtract(offset,"minute").format()}
            default:
                return {start: daterange.start, end: daterange.end}
        }
    }
}