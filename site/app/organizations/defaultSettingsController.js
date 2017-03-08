'use strict';
define([
    'app'
], function (app) {
     app.controller
        ('defaultSettingsController', ['$scope', '$uibModalInstance', 'organization', 'ngProgress', '$rootScope','toastr', function ($scope, $uibModalInstance, organization, ngProgress, $rootScope, toastr) {

            ga('set', 'title', "/defaultSettings");
            ga('set', 'page', "/defaultSettings");
            ga('send', 'pageview');
            
            $scope.mapTo = {};
            $scope.organization = organization;

            $scope.organization.settings = {
                updates: {
                    allow: true,
                    set: false,
                    default_value: true
                },
                how_often: {
                    allow: true,
                    set: false,
                    default_value: "* * * * 2"
                },
                all_properties: {
                    allow: true,
                    set: false,
                    default_value: true
                },
                reminders: {
                    allow: true,
                    set: false,
                    default_value: true
                },
                leased: {
                    allow: true,
                    set: false,
                    default_value: true
                },
                renewal: {
                    allow: true,
                    set: false,
                    default_value: true
                },
                detailed_concessions: {
                    allow: true,
                    set: false,
                    default_value: false
                },
            }

            $scope.nots = {
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

                $scope.nots.daysOfMonth.push({id:i,name: i.toString() + name})
            }

            $scope.nots.daysOfMonth.push({id:"L",name:'Last'});

            $scope.nots.howOften = $scope.nots.howOftenOptions[0];
            $scope.nots.dayOfWeek = $scope.nots.daysOfWeek[2];
            $scope.nots.dayOfMonth = $scope.nots.daysOfMonth[0];


            $scope.cancel = function () {
                $uibModalInstance.dismiss('cancel');
            };



    }]);

});