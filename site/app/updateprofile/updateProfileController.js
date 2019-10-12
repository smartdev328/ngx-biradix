'use strict';
define([
  'app',
  '../../services/cronService.js',
], function (app) {
  app.controller
  ('updateProfileController', ['$scope', '$authService', 'ngProgress', '$rootScope','toastr', '$location','$userService','$stateParams','$propertyService','$cronService', '$reportingService',
    function ($scope, $authService, ngProgress, $rootScope, toastr, $location, $userService, $stateParams, $propertyService, $cronService, $reportingService) {
      window.setTimeout(function() {window.document.title = "My Account - Update Profile | BI:Radix";},1500);

      $rootScope.nav = "";
      $rootScope.sideMenu = true;

      if ($stateParams.password) {
        $scope.isPassword = true;
        $rootScope.sideNav = "UpdatePassword";
      } else if ($stateParams.notifications === "1") {
        $scope.isNotifications = true;
        $rootScope.sideNav = "UpdateNotifications";
      } else if ($stateParams.settings === "1") {
        $scope.isSettings = true;
        $rootScope.sideNav = "UpdateSettings";
      } else {
        $scope.isProfile = true;
        $rootScope.sideNav = "UpdateProfile";
      }

      $scope.timezones = [
        {id: 'America/Los_Angeles', name: "Los Angeles (Pacific)"},
        {id: 'America/Phoenix', name: "Phoenix (Arizona)"},
        {id: 'America/Denver', name: "Denver (Mountain)"},
        {id: 'America/Chicago', name: "Chicago (Central)"},
        {id: 'America/New_York', name: "New York (Eastern)"},
      ];


      $scope.settings = {
        tz: $scope.timezones[0]
      };

      $reportingService.multiSelectWatcher($scope, "settings.perspectiveItems");

      $scope.$watch("settings.perspectiveItems", function(n, o) {
        if (!$scope.settings.perspectiveItems || $scope.settings.perspectiveItems.length == 0) {
          return;
        }
        $scope.settings.perspectives = _.map(_.filter($scope.settings.perspectiveItems, function(x) {
          return x.selected;
        }), "id");
      });

      $scope.$watch('propertyItems.items', function() {
        $scope.settings.perspectiveItems = [];
        if ($scope.propertyItems && $scope.propertyItems.items && $scope.propertyItems.items.length) {
          var selected;
          $scope.propertyItems.items.forEach(function (p) {
            p.perspectives = p.perspectives || [];
            p.perspectives.forEach(function (pr) {
              selected = _.find($scope.settings.perspectives, function (x) {
                return x.propertyId.toString() === p.id.toString() && x.perspectiveId.toString() === pr.id.toString();
              });
              $scope.settings.perspectiveItems.push({
                id: {
                  propertyId: p.id,
                  perspectiveId: pr.id
                }, name: pr.name, group: p.name, selected: !!selected
              });
            });
          });

        }

      },true);

      var unbind = $rootScope.$watch("me", function(x) {
        if ($rootScope.me) {
          $scope.settings.tz = _.find($scope.timezones, function(x) {return x.id == $rootScope.me.settings.tz});

          if (!$scope.settings.tz) {
            $scope.settings.tz = $scope.timezones[0];
          }

          $scope.settings.showLeases = $rootScope.me.settings.showLeases;
          $scope.settings.showATR = $rootScope.me.settings.showATR;
          $scope.settings.showRenewal = $rootScope.me.settings.showRenewal;
          $scope.settings.notifications = {on: $rootScope.me.settings.notifications.on, groupComps: $rootScope.me.settings.notifications.groupComps, toggle: false}
          $scope.settings.reminders = {on: $rootScope.me.settings.reminders.on}

          $scope.settings.perspectives = $rootScope.me.settings.perspectives;

          $scope.user = { first: $rootScope.me.first, last:  $rootScope.me.last, email:  $rootScope.me.email }

          $scope.canUpdateEmail = $rootScope.me.permissions.indexOf('Users/UpdateEmail') > -1

          if (!$rootScope.me.passwordUpdated) {
            toastr.warning('For security purposes, please update the temporary password assigned to you.');
          }

          if ($rootScope.me.bounceReason) {
            toastr.error('We were unable to deliver email to your email address: <b>' + $rootScope.me.email + '</b>. Please verify your email address and click "Update".');
          }

          //$rootScope.me.settings.notifications.props = ['5642bae9ff18a018187b2e9f','5642bab4ff18a018187b0417'];

          $scope.nots = $cronService.getOptions($rootScope.me.settings.notifications.cron);

          $scope.nots.all = false;

          $scope.propertyOptions = {noneLabel: "All", panelWidth:210, minwidth:'100%', hideSearch: false, dropdown: true, dropdownDirection : 'left', labelAvailable: "Excluded Properties", labelSelected: "Included Properties", searchLabel: "Properties" }

          $scope.columnsOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields" }

          $scope.perspectiveOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Reports", labelSelected: "Selected Reports", searchLabel: "Reports", noneLabel: "All Data" }

          $scope.alertOptions = { hideSearch: true, dropdown: true, dropdownDirection : 'left', labelAvailable: "Available Fields", labelSelected: "Selected Fields", searchLabel: "Fields" }

          $scope.setNotificationColumns($rootScope.me.settings.notification_columns);

          $scope.propertyItems = {items: []};
          $scope.alertItems = {items: [
              {id: "", name: "Please select..."},
              {id: "ner_week", name: "NER vs. Last Week", group: "NER"},
              {id: "ner_month", name: "NER vs. Last Month", group: "NER"},
              {id: "ner_year", name: "NER vs. Last Year", group: "NER"},
              {id: "ner_compaverage", name: "NER vs. Comp Avg", group: "NER"},

              {id: "occ_week", name: "Occ. % vs. Last Week", group: "Occupancy %"},
              {id: "occ_month", name: "Occ. % vs. Last Month", group: "Occupancy %"},
              {id: "occ_year", name: "Occ. % vs. Last Year", group: "Occupancy %"},
              {id: "occ_compaverage", name: "Occ. % vs. Comp Avg", group: "Occupancy %"},

              {id: "leased_week", name: "Leased % vs. Last Week", group: "Leased %"},
              {id: "leased_month", name: "Leased % vs. Last Month", group: "Leased %"},
              {id: "leased_year", name: "Leased % vs. Last Year", group: "Leased %"},
              {id: "leased_compaverage", name: "Leased % vs. Comp Avg", group: "Leased %"},
            ], percents: [-50, -25, -10, -5, 5, 10, 25, 50, 100], select: null};
          $scope.alertItems.selected = $scope.alertItems.items[0];

          if (!$rootScope.me.settings.showLeases) {
            _.remove($scope.alertItems.items, function(x) {
              return x.id === 'leased_week' || x.id === 'leased_month'|| x.id === 'leased_year' || x.id === 'leased_compaverage'
            })
          }

          $rootScope.me.settings.notifications.alerts = $rootScope.me.settings.notifications.alerts || [];
          $scope.selectedAlerts = [];
          var item;
          $rootScope.me.settings.notifications.alerts.forEach(function(a) {
            item = _.find($scope.alertItems.items, function(x) {
              return x.id === a.id;
            });
            if (item) {
              $scope.selectedAlerts.push({
                id: a.id,
                value: a.value,
                name: item.name
              })
            }
          });

          $scope.selectedAlerts = _.sortByAll($scope.selectedAlerts, "name");

          if ($rootScope.me.settings.notifications.props.length == 0) {
            $scope.notificationsLoaded = true;
          }
          else {
            $propertyService.search({
              permission: ['PropertyManage'],
              active: true,
              ids: $rootScope.me.settings.notifications.props
              , skipAmenities: true
              , hideCustom : true
              , select: "name perspectives"
            }).then(function (response) {

              if (response.data.properties || response.data.properties.length > 0) {
                response.data.properties.forEach(function(p) {
                  $scope.propertyItems.items.push({id: p._id, name: p.name, perspectives: p.perspectives})
                })

              }


              $scope.notificationsLoaded = true;

            }, function (error) {
              $scope.notificationsLoaded = true;
            })
          }

          unbind();
        }
      })

      $scope.addAlert = function() {
        if ($scope.alertItems.selected && $scope.alertItems.selected.id) {
          $scope.selectedAlerts.push({
            id: $scope.alertItems.selected.id,
            value: 10,
            name: $scope.alertItems.selected.name
          });

          var col = "";
          switch($scope.alertItems.selected.id) {
            case "ner_week":
              col = "nerweek";
              break;
            case "ner_month":
              col = "nermonth";
              break;
            case "ner_year":
              col = "neryear";
              break;
            case "ner_compaverage":
              col = "nervscompavg";
              break;
            case "occ_week":
            case "occ_month":
            case "occ_year":
            case "occ_compaverage":
              col = "occupancy";
              break;
            case "leased_week":
            case "leased_month":
            case "leased_year":
            case "leased_compaverage":
              col = "leased";
              break;
          }
          if (col) {
            var selCol = $scope.columnsItems.items.find(function (x) {
              return x.id.toString() === col;
            });
            selCol.selected = true;
          }
        } else {
          toastr.error("Please select an alert before clicking <b>Add Alert</b>");
        }
      };

      $scope.setNotificationColumns = function(columns) {
        $scope.columnsItems = {items: []};
        $scope.columnsItems.items = [
          {id: "occupancy", name: "Occ. %", selected: columns.occupancy},
          {id: "leased", name: "Leased %", selected: columns.leased || false},
          {id: "atr", name: "ATR %", selected: columns.atr || false},
          {id: "weekly", name: "Traffic & Leases / Week", selected: columns.weekly},
          {id: "units", name: "Units", selected: columns.units},
          {id: "sqft", name: "Sqft", selected: columns.sqft},
          {id: "rent", name: "Rent", selected: columns.rent},
          {id: "concessions", name: "Total Concession", selected: columns.concessions},
          {id: "runrate", name: "Recurring Rent", selected: columns.runrate},
          {id: "runratesqft", name: "Recurring Rent / Sqft", selected: columns.runratesqft},
          {id: "ner", name: "Net Eff. Rent", selected: columns.ner},
          {id: "nerweek", name: "NER vs Last Week", selected: columns.nerweek},
          {id: "nermonth", name: "NER vs Last Month", selected: columns.nermonth},
          {id: "neryear", name: "NER vs Last Year", selected: columns.neryear},
          {id: "nersqft", name: "Net Eff. Rent / Sqft", selected: columns.nersqft},
          {id: "nersqftweek", name: "NER/Sqft vs Last Week", selected: columns.nersqftweek},
          {id: "nersqftmonth", name: "NER/Sqft vs Last Month", selected: columns.nersqftmonth},
          {id: "nersqftyear", name: "NER/Sqft vs Last Year", selected: columns.nersqftyear},
          {id: "nervscompavg", name: "NER vs Comp Avg", selected: columns.nervscompavg},
          {id: "last_updated", name: "Last Updated", selected: columns.last_updated},
        ];

        if (!$rootScope.me.settings.showLeases) {
          _.remove($scope.columnsItems.items, function(x) {return x.id == 'leased'})
        }

        if (!$rootScope.me.settings.showATR) {
          _.remove($scope.columnsItems.items, function(x) {return x.id == 'atr'})
        }
      }

      $scope.autocompleteproperties = function(search,callback) {
        $propertyService.search({
          limit: 100,
          permission: ['PropertyManage'],
          active: true,
          search:search
          , skipAmenities: true
          , hideCustom : true
          , select: "name perspectives"
        }).then(function (response) {
          callback(response.data.properties)
        }, function (error) {
          callback([]);
        })

      }

      $scope.submit = function (user) {
        $('button.contact-submit').prop('disabled', true);
        ngProgress.start();
        $authService.updateMe(user).then(function (resp) {
          $('button.contact-submit').prop('disabled', false);
          ngProgress.complete();
          if (resp.data.errors && resp.data.errors.length > 0) {
            var errors = _.pluck(resp.data.errors,"msg").join("<br>")
            toastr.error(errors);
          }
          else {
            toastr.success('Profile updated successfully.');
            $rootScope.refreshToken(true, function() {});
          }


        }, function (err) {
          $('button.contact-submit').prop('disabled', false);
          rg4js('send', new Error("User saw API unavailable error alert/message/page"));
          toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
          ngProgress.complete();
        });
      }

      $scope.password = {};

      $scope.submitPassword = function(user, myFormPassword) {

        if (user.newpassword != user.confirmpassword) {
          toastr.error('Passwords do not match.');
          return;
        }
        $('button.contact-submit').prop('disabled', true);
        ngProgress.start();

        $userService.updatePassword(user).then(function (resp) {
          if (resp.data.errors && resp.data.errors.length > 0) {
            resp.data.errors.forEach(function(e) {
              toastr.error(e.msg);
            })
            $('button.contact-submit').prop('disabled', false);
            ngProgress.complete();
          }
          else {
            $rootScope.refreshToken(true, function() {
              toastr.success('Password updated successfully.');
              user.newpassword = "";
              user.confirmpassword = "";
              user.currentpassword = "";
              $rootScope.me.passwordUpdated = true;
              myFormPassword.$setPristine();
              myFormPassword.$setUntouched();
              $('button.contact-submit').prop('disabled', false);
              ngProgress.complete();
            });
          }

        }, function (err) {
          $('button.contact-submit').prop('disabled', false);
          rg4js('send', new Error("User saw API unavailable error alert/message/page"));
          toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
          ngProgress.complete();
        });
      }

      $scope.sendReport = function() {
        var prepared = $scope.prepareNotifications();
        if (prepared.error) {
          toastr.error(prepared.error);

          return;
        }

        $propertyService.notifications_test(prepared.props,$scope.settings.showLeases,prepared.notification_columns, $scope.settings.notifications.groupComps, $scope.settings.perspectives, prepared.alerts);
        toastr.success('Your request for a notifications report has been submitted. Please allow up to 5 minutes to receive your report.');
      };

      $scope.prepareNotifications = function() {
        var props = [];
        var error = "";
        var notification_columns = {};
        var alerts = [];
        if ($scope.nots.all === true) {
          props = [];
        } else {
          props = _.pluck($scope.propertyItems.items,"id")
        }

        var c= 0;
        var hasNervsCompAvg = false;
        var hasNerWeek = false;
        var hasNerMonth = false;
        var hasNerYear = false;
        var hasOcc = false;
        var hasLeased = false;
        $scope.columnsItems.items.forEach(function (f) {
          notification_columns[f.id] = f.selected;

          if (f.selected === true) {
            c++;

            if (f.id === "nervscompavg") {
              hasNervsCompAvg = true;
            } else if (f.id === "nerweek") {
              hasNerWeek = true;
            } else if (f.id === "nermonth") {
              hasNerMonth = true;
            } else if (f.id === "neryear") {
              hasNerYear = true;
            } else if (f.id === "occupancy") {
              hasOcc = true;
            } else if (f.id === "leased") {
              hasLeased = true;
            }
          }
        });

        if (c > 13) {
          error = "<B>Unable to Update Notification Settings!</B><Br><Br>You have selected <b>" + c + "</b> columns for your competitor report. Having over <u>13</u> columns will not fit in the property status update.";

        } else {
          $scope.selectedAlerts.forEach(function (a) {
            if (!error) {
              if ((a.id === "ner_compaverage") && !hasNervsCompAvg) {
                error = "<B>Unable to Update Notification Settings!</B><Br><Br>To set an <b>Alert</b> for <b>NER vs Comp Avg</b>, please select the <b>NER vs Comp Avg</b> column."
              } else if ((a.id === "ner_week") && !hasNerWeek) {
                error = "<B>Unable to Update Notification Settings!</B><Br><Br>To set an <b>Alert</b> for <b>NER vs Last Week</b>, please select the <b>NER vs Last Week</b> column."
              } else if ((a.id === "ner_month") && !hasNerMonth) {
                error = "<B>Unable to Update Notification Settings!</B><Br><Br>To set an <b>Alert</b> for <b>NER vs Last Month</b>, please select the <b>NER vs Last Month</b> column."
              } else if ((a.id === "ner_year") && !hasNerYear) {
                error = "<B>Unable to Update Notification Settings!</B><Br><Br>To set an <b>Alert</b> for <b>NER vs Last Year</b>, please select the <b>NER vs Last Year</b> column."
              } else if ((a.id === "occ_compaverage") && !hasOcc) {
                error = "<B>Unable to Update Notification Settings!</B><Br><Br>To set an <b>Alert</b> for <b>Occ. % vs Comp Avg</b>, please select the <b>Occ. % vs Comp Avg</b> column."
              } else if ((a.id === "occ_week") && !hasOcc) {
                error = "<B>Unable to Update Notification Settings!</B><Br><Br>To set an <b>Alert</b> for <b>Occ. % vs Last Week</b>, please select the <b>Occ. % vs Last Week</b> column."
              } else if ((a.id === "occ_month") && !hasOcc) {
                error = "<B>Unable to Update Notification Settings!</B><Br><Br>To set an <b>Alert</b> for <b>Occ. % vs Last Month</b>, please select the <b>Occ. % vs Last Month</b> column."
              } else if ((a.id === "occ_year") && !hasOcc) {
                error = "<B>Unable to Update Notification Settings!</B><Br><Br>To set an <b>Alert</b> for <b>Occ. % vs Last Year</b>, please select the <b>Occ. %</b> column."
              } else if ((a.id === "leased_week") && !hasLeased) {
                error = "<B>Unable to Update Notification Settings!</B><Br><Br>To set an <b>Alert</b> for <b>Leased % vs Last Week</b>, please select the <b>Leased %</b> column."
              } else if ((a.id === "leased_month") && !hasLeased) {
                error = "<B>Unable to Update Notification Settings!</B><Br><Br>To set an <b>Alert</b> for <b>Leased % vs Last Month</b>, please select the <b>Leased %</b> column."
              } else if ((a.id === "leased_year") && !hasLeased) {
                error = "<B>Unable to Update Notification Settings!</B><Br><Br>To set an <b>Alert</b> for <b>Leased % vs Last Year</b>, please select the <b>Leased %</b> column."
              } else if ((a.id === "leased_compaverage") && !hasLeased) {
                error = "<B>Unable to Update Notification Settings!</B><Br><Br>To set an <b>Alert</b> for <b>Leased % vs Comp Avg</b>, please select the <b>Leased %</b> column."
              }

            }
          });

          if (!error) {
            alerts = _.map($scope.selectedAlerts, function (x) {
              return {
                id: x.id,
                value: x.value,
              }
            });

            alerts = _.unique(alerts, function(x) {
              return x.id + x.value;
            }, Object);
          }
        }

        return {props: props, error: error, notification_columns: notification_columns, alerts: alerts};
      };

      $scope.saveNotifications = function() {
        if ($rootScope.me.settings.notifications.on === true) {
          var prepared = $scope.prepareNotifications();
          if (prepared.error) {
            toastr.error(prepared.error);

            return;
          }
          $rootScope.me.settings.notifications.props = prepared.props;
          $rootScope.me.settings.notification_columns = prepared.notification_columns;
          $rootScope.me.settings.notifications.alerts = prepared.alerts;
          $rootScope.me.settings.perspectives = $scope.settings.perspectives;
          $rootScope.me.settings.notifications.cron = $cronService.getCron($scope.nots);

          $rootScope.me.settings.notifications.on = $scope.settings.notifications.on;
          $rootScope.me.settings.reminders.on = $scope.settings.reminders.on;
          $rootScope.me.settings.notifications.groupComps = $scope.settings.notifications.groupComps;
        }


        $('button.contact-submit').prop('disabled', true);
        ngProgress.start();

        $authService.updateSettings($rootScope.me.settings).then(function (resp) {
          if (resp.data.errors && resp.data.errors.length > 0) {
            resp.data.errors.forEach(function(e) {
              toastr.error(e.msg);
            });
            $('button.contact-submit').prop('disabled', false);
            ngProgress.complete();
          }
          else {
            toastr.success("Notifications updated successfully.");

            $rootScope.refreshToken(true, function() {
              $('button.contact-submit').prop('disabled', false);
              ngProgress.complete();
            });
          }
        }, function (err) {
          $('button.contact-submit').prop('disabled', false);
          rg4js('send', new Error("User saw API unavailable error alert/message/page"));
          toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
          ngProgress.complete();
        });
      };

      $scope.saveSettings = function() {

        $rootScope.me.settings.tz = $scope.settings.tz.id;
        $rootScope.me.settings.showLeases = $scope.settings.showLeases;
        $rootScope.me.settings.showATR = $scope.settings.showATR;
        $rootScope.me.settings.showRenewal = $scope.settings.showRenewal;


        $('button.contact-submit').prop('disabled', true);
        ngProgress.start();

        $authService.updateSettings($rootScope.me.settings).then(function (resp) {
          if (resp.data.errors && resp.data.errors.length > 0) {
            resp.data.errors.forEach(function(e) {
              toastr.error(e.msg);
            })
            $('button.contact-submit').prop('disabled', false);
            ngProgress.complete();
          } else {
            toastr.success("Settings updated successfully.");

            $rootScope.refreshToken(true, function() {
              $('button.contact-submit').prop('disabled', false);
              ngProgress.complete();
            });
          }
        }, function (err) {
          $('button.contact-submit').prop('disabled', false);
          rg4js('send', new Error("User saw API unavailable error alert/message/page"));
          toastr.error("Pretend you didn't see this! Something went wrong and we can only show you this message. Sorry for the trouble. Please try refreshing the page");
          ngProgress.complete();
        });
      }

      $scope.reset = function() {
        $scope.propertyItems.items = [];
        $scope.settings.notifications.groupComps = undefined;
        $scope.setNotificationColumns($rootScope.me.orgs[0].settings.notification_columns.default_value);
        $scope.nots = $cronService.getOptions($rootScope.me.orgs[0].settings.how_often.default_value);
        $scope.settings.notifications.on = $rootScope.me.orgs[0].settings.updates.default_value;
        $scope.settings.reminders.on = $rootScope.me.orgs[0].settings.reminders.default_value;
        toastr.success("Notifications reset to company default. Please make sure to save your changes.");

      }


    }]);

});
