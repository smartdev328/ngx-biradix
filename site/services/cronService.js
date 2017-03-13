'use strict';
define([
    'app'
], function (app) {
    app.factory('$cronService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.getCron = function(options) {
            if (options.howOften == "Weekly") {
                return "* * * * " + options.dayOfWeek.id;
            } else {
                return "* * " + options.dayOfMonth.id + " * *";
            }
        }

        fac.getOptions = function (cron) {
            var nots = {
                howOftenOptions: ["Weekly","Monthly"],
                daysOfWeek: [
                    {id:0,name:'Sunday'},
                    {id:1,name:'Monday'},
                    {id:2,name:'Tuesday'},
                    {id:3,name:'Wednesday'},
                    {id:4,name:'Thursday'},
                    {id:5,name:'Friday'},
                    {id:6,name:'Saturday'},
                ],

                daysOfMonth: [

                ],
            };

            for (var i = 1; i < 29; i++) {
                var name = "th";
                if (i == 1 || i == 21 || i == 31) {name = "st"}
                if (i == 2 || i == 22) {name = "nd"}
                if (i == 3 || i == 23) {name = "rd"}

                nots.daysOfMonth.push({id:i,name: i.toString() + name})
            }

            nots.daysOfMonth.push({id:"L",name:'Last'});

            nots.howOften = nots.howOftenOptions[0];
            nots.dayOfWeek = nots.daysOfWeek[2];
            nots.dayOfMonth = nots.daysOfMonth[0];

            var arCron = cron.split(" ");

            if (arCron[4] == "*") {
                nots.howOften = nots.howOftenOptions[1]
                nots.dayOfMonth = _.find(nots.daysOfMonth, function(x) {
                    return x.id.toString() == arCron[2];
                })
            }
            else {
                nots.dayOfWeek = _.find(nots.daysOfWeek, function(x) {
                    return x.id.toString() == arCron[4];
                })
            }

            return nots;
        }

        return fac;
    }]);
});