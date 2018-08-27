const moment = require("moment");
const WEEK = 7 * 24 * 60 * 60 * 1000;

module.exports = {
    getAllMondaysInDateRange: function(daterange, offset) {
        const range = this.convertRangeToParts(daterange, offset);

        let monday = parseInt(moment(range.start).utc().add(offset, "minute").day("Monday").startOf("day").subtract(offset, "minute").format("x"));

        const results = [];

        while (monday < moment(range.end).format("x")) {
            results.push(monday);
            monday += WEEK;
        }

        return results;
    },

    convertRangeToParts: function(daterange, offset) {
        daterange = daterange || {daterange: "Last 90 Days"};

        switch (daterange.daterange) {
            case "Today":
                return {start: moment().utc().add(offset, "minute").startOf("day").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").endOf("day").subtract(offset, "minute").format()};
            case "Week to Date":
                return {start: moment().utc().add(offset, "minute").startOf("week").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").endOf("day").subtract(offset, "minute").format()};
            case "Month to Date":
                return {start: moment().utc().add(offset, "minute").startOf("month").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").endOf("day").subtract(offset, "minute").format()};
            case "Previous Month":
                return {start: moment().utc().add(offset, "minute").subtract(1, "month").startOf("month").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").subtract(1, "month").endOf("month").subtract(offset, "minute").format()};
            case "Year to Date":
            case "This Year-to-Date":
                return {start: moment().utc().add(offset, "minute").startOf("year").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").endOf("day").subtract(offset, "minute").format()};
            case "90 Days":
            case "Last 90 Days":
                return {start: moment().utc().add(offset, "minute").add(-90, "day").startOf("day").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").endOf("day").subtract(offset, "minute").format()};
            case "Previous 90 Days":
                return {start: moment().utc().add(offset, "minute").add(-180, "day").startOf("day").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").subtract(91, "days").endOf("day").subtract(offset, "minute").format()};
            case "30 Days":
            case "Last 30 Days":
                return {start: moment().utc().add(offset, "minute").add(-30, "day").startOf("day").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").endOf("day").subtract(offset, "minute").format()};
            case "Previous 30 Days":
                return {start: moment().utc().add(offset, "minute").add(-60, "day").startOf("day").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").subtract(31, "days").endOf("day").subtract(offset, "minute").format()};
            case "Last 7 Days":
                return {start: moment().utc().add(offset, "minute").add(-7, "day").startOf("day").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").endOf("day").subtract(offset, "minute").format()};
            case "12 Months":
            case "Last 12 Months":
                return {start: moment().utc().add(offset, "minute").add(-1, "year").startOf("day").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").endOf("day").subtract(offset, "minute").format()};
            case "Previous 12 Months":
                return {start: moment().utc().add(offset, "minute").add(-2, "year").startOf("day").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").subtract(1, "year").subtract(1, "day").endOf("day").subtract(offset, "minute").format()};
            case "Same Month - Previous Year":
                return {start: moment().utc().add(offset, "minute").subtract(1, "month").subtract(1, "year").startOf("month").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").subtract(1, "month").subtract(1, "year").endOf("month").subtract(offset, "minute").format()};
            case "Previous Year-To-Date":
                return {start: moment().utc().add(offset, "minute").subtract(1, "year").startOf("year").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").subtract(1, "year").endOf("day").subtract(offset, "minute").format()};
            case "Previous Year":
                return {start: moment().utc().add(offset, "minute").subtract(1, "year").startOf("year").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").subtract(1, "year").endOf("year").subtract(offset, "minute").format()};
            case "Lifetime":
                return {start: moment().utc().add(offset, "minute").add(-30, "year").startOf("day").subtract(offset, "minute").format(), end: moment().utc().add(offset, "minute").endOf("day").subtract(offset, "minute").format()};
            default:
                return {start: daterange.start, end: moment(daterange.end).utc().add(offset, "minute").endOf("day").subtract(offset, "minute").format()};
        }
    },
};
