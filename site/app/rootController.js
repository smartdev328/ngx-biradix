angular.module("biradix.global").controller("rootController",
    ["$scope", "$location", "$rootScope", "$cookies", "$authService", "$propertyService", "$window", "$uibModal", "toastr", "ngProgress", "$timeout", "$sce", "$amenityService","$auditService",
        function($scope, $location, $rootScope, $cookies, $authService, $propertyService, $window, $uibModal, toastr, ngProgress, $timeout, $sce, $amenityService,$auditService) {
        $scope.hasSessionStorage = true;
        try {
            window.sessionStorage;
        } catch (ex) {
            $scope.hasSessionStorage = false;
        }

        $scope.env = "";
        var loc = window.location.href.toLowerCase();

        if (loc.indexOf('//localhost') > -1) {
            $scope.env = "This is LOCAL";
        }
        else
        if (loc.indexOf('//qa.biradix.com') > -1) {
            $scope.env = "This is QA";
        }
        else
        if (loc.indexOf('//biradixplatform-qa-pr-') > -1) {
            $scope.env = "This is PR";
        }
        else
        if (loc.indexOf('//biradixplatform-integration') > -1) {
            $scope.env = "This is INT";
        }

        $rootScope.version = version;
        $rootScope.logoBig = logoBig + '?';

        if ($cookies.get('token')) {
            $rootScope.loggedIn = true;
        }
        else {
            $rootScope.loggedIn = false;
        }

        $rootScope.timeout = 0;

        // Global functions
        $rootScope.resetTimeout = function() {
            $rootScope.timeout = 0;
        }

        $rootScope.incrementTimeout = function() {
            if ($scope.$$childHead == null) {
                return;
            }
            $rootScope.timeout++;

            // log off after 60 minutes of inactivity
            if ($rootScope.timeout > 60 * 60) {
                if ($rootScope.loggedIn && $scope.hasSessionStorage) {
                    $window.sessionStorage.redirect = $location.path();
                }
                $rootScope.logoff();
            }

            $timeout($rootScope.incrementTimeout, 1000);
        }

        var refreshFactor = 1;
        $rootScope.refreshToken = function(force, callback) {
            if (!$rootScope.validateTokens()) {
                return;
            }
            var refresh = !!force;

            if (!refresh) {
                var date = $cookies.get('tokenDate');

                if (!date) {
                    date = new Date();
                } else {
                    date = new Date(date);
                }

                var tokenAgeInMinutes = (new Date().getTime() - date.getTime()) / 1000 / 60 * refreshFactor;

                if (tokenAgeInMinutes > 30) {
                    refresh = true;
                }
            }

            if (refresh) {
                $authService.refreshToken($cookies.get('token'), function (usr, status) {
                    if (usr) {
                        if (usr.maintenance === true) {
                            $rootScope.logoff();
                            return;
                        }

                        $rootScope.me = usr;
                        $rootScope.reload = false;

                        if ($rootScope.me.version.toString() !== version.toString()) {
                            $rootScope.reload = true;
                        }

                        $window.setTimeout($rootScope.refreshToken, 60/refreshFactor * 1000); // start token refresh in 1 min

                        if (callback) {
                            callback();
                        }
                    } else if (status == 401 ) {
                        if ($rootScope.loggedIn && $scope.hasSessionStorage) {
                            $window.sessionStorage.redirect = $location.path();
                        }
                        $rootScope.logoff();
                    }
                    else if (status == 0 ) {
                        $window.setTimeout($rootScope.refreshToken,60/refreshFactor * 1000); // start token refresh in 1 min
                    }
                });
            } else {
                $rootScope.getMe(function() {
                    $rootScope.reload = false;

                    if ($rootScope.me.version.toString() != version.toString()) {
                        $rootScope.reload = true;
                    }

                    $window.setTimeout($rootScope.refreshToken,60/refreshFactor * 1000); // start token refresh in 1 min
                    if (callback) {
                        callback();
                    }
                });
            }
        }

        $scope.searches = {
            search1: "",
            search2: "",
        }
        $scope.first = true;

        $rootScope.notifications = [];

        $rootScope.validateTokens = function() {
            if (!$cookies.get("token")) {
                if ($scope.hasSessionStorage) {
                    $window.sessionStorage.redirect = $location.path();
                }
                $rootScope.logoff();
                return false;
            }

            var date = $cookies.get('tokenDate');

            if (!date) {
                date = new Date();
            } else {
                date = new Date(date);
            }

            var tokenAgeInMinutes = (new Date().getTime() - date.getTime()) / 1000 / 60;

            if (tokenAgeInMinutes > 65) {
                if ($scope.hasSessionStorage) {
                    $window.sessionStorage.redirect = $location.path();
                }
                $rootScope.logoff();
                return false;
            }

            return true;
        }
        $rootScope.getMe = function(callback) {

            if (!$rootScope.validateTokens()) {
                return;
            }

            $authService.me($cookies.get('token'), function (usr, status) {
                if (usr) {

                    if (usr.maintenance === true) {
                        $rootScope.logoff();
                        return;
                    }

                    $rootScope.me = usr;

                    if ($scope.first) {
                        $scope.alerts();
                    }

                    if ($scope.first && !$rootScope.me.passwordUpdated) {

                        if (!phantom) {
                            $timeout(function () {
                                $location.path("/updateProfile").search('password', '1');
                            }, 2000)

                        }
                    }
                    else if ($scope.first && $rootScope.me.bounceReason) {

                        if (!phantom) {
                            $timeout(function () {
                                $location.path("/updateProfile");
                            }, 2000)
                        }
                    }

                    $scope.first = false;

                    if (callback) {
                        callback();
                    }
                }
                else if (status == 401) {
                    if ($rootScope.loggedIn && $scope.hasSessionStorage) {
                        $window.sessionStorage.redirect = $location.path();
                    }
                    $rootScope.logoff()
                }
                else if (status == 0) {
                    if (callback) {
                        callback();
                    }
                }
            })
        }

        $rootScope.updateLogos = function() {
            var org;

            if ($rootScope.me.orgs.length == 1) {
                org = $rootScope.me.orgs[0];
            } else {
                $rootScope.me.orgs.forEach(function(x) {
                    if (x.subdomain.toLowerCase() == window.location.hostname.toLowerCase()) {
                        org = x;
                    }
                })

                if (!org) {
                    org = $rootScope.me.orgs[0];
                }

            }

            $('.logoBig').each(function(l) {
                this.src = "/images/organizations/" + org.logoBig + "?"
            })

            $('.logoSmall').each(function(l) {
                this.src = "/images/organizations/" + org.logoSmall
            })
        }

        $rootScope.swaptoLoggedIn = function(redirect) {
            $rootScope.getMe(function() {
                Raygun.setUser(
                    $rootScope.me.email,
                    false,
                    $rootScope.me.email,
                    $rootScope.me.first + " " + $rootScope.me.last,
                    $rootScope.me.first,
                    $rootScope.me.orgs[0].name
                );
                $rootScope.loggedIn = true;
                $('.loading').hide();
                $('.loggedout').hide();
                $('.loggedin').show();

                $('body').css("padding-top","0px")

                $rootScope.updateLogos();


                $window.setTimeout($rootScope.refreshToken,60/refreshFactor * 1000); // start token refresh in 1 min
                $timeout($rootScope.incrementTimeout, 1000);

                var ar = location.hash.split("login?r=");
                if (ar.length == 2 && $scope.hasSessionStorage) {
                    $window.sessionStorage.redirect = decodeURIComponent(ar[1]);
                }

                if ($scope.hasSessionStorage && $window.sessionStorage.redirect) {
                    var x = $window.sessionStorage.redirect;
                    $window.sessionStorage.removeItem('redirect');

                    //Make sure we dont redirect to /login
                    if (x.indexOf('/login') == -1) {
                        if (x.indexOf("?") == -1) {
                            $location.path(x)
                        } else {
                            var a = x.split('?')
                            $location.path(a[0]).search(a[1]);
                        }
                    } else {
                        $location.path("/dashboard");
                    }

                } else {
                    if (redirect !== false) {
                        $location.path("/dashboard");
                    }
                }


            });

        }

        $rootScope.swaptoLoggedOut = function() {
            $('.loading').hide();
            $('.loggedout').show();
            $('.loggedin').hide();
            $('body').css("padding-top","10px")
            $rootScope.loggedIn = false;
        }

        //Local functions
        $rootScope.logoff = function() {
            $rootScope.loggedIn = false;
            $cookies.remove('token');
            window.location.href = "/";
        }

        $rootScope.toggleUnlniked = function() {
            //$rootScope.me.settings.hideUnlinked = !$rootScope.me.settings.hideUnlinked;
            ngProgress.start();
            $authService.updateSettings($rootScope.me.settings).then(function (resp) {
                ngProgress.complete();
                if (resp.data.errors && resp.data.errors.length > 0) {
                    var errors = _.pluck(resp.data.errors,"msg").join("<br>")
                    toastr.error(errors);
                    $rootScope.me.settings.hideUnlinked = !$rootScope.me.settings.hideUnlinked;
                }
                else {
                    if ($rootScope.me.settings.hideUnlinked) {
                        toastr.warning('Excluded comped floor plans will now be hidden in all your data results.')
                    } else {
                        toastr.success('Excluded comped floor plans will now be shown in all your data results.')
                    }


                    $rootScope.refreshToken(true, function() {
                        $rootScope.$broadcast('data.reload');
                    });
                }


            }, function (err) {
                $rootScope.me.settings.hideUnlinked = !$rootScope.me.settings.hideUnlinked;
                toastr.error('Unable to perform action. Please contact an administrator');
                ngProgress.complete();
            });




        }

        $scope.sanitize = function(s) {
            return $sce.trustAsHtml(s);
        }
        $scope.getLocation = function (val,hideCustomComps,hideCustom) {
            return $propertyService.search({search: val, active: true, skipAmenities: true, limit: 10, hideCustomComps: hideCustomComps, hideCustom: hideCustom }).then(function (response) {
                return response.data.properties
            });
        };

        $scope.disableSearchKeys = function(event) {
            switch(event.keyCode) {
                case 191: // "/"
                case 220: // "\"
                    event.preventDefault();
            }
        }

        $scope.searchSelected = function (item, model, label) {
            $scope.searches.search1 = "";
            $scope.searches.search2 = "";
            $rootScope.turnOffSearch();
            $location.path("/profile/" + item._id);
        }

        // Decide if logged in or not.
        if (!$rootScope.loggedIn) {
            $rootScope.swaptoLoggedOut();
        }
        else {
            $rootScope.swaptoLoggedIn(false);
        }

        // make sure in full screen right nav is always shown
        var w = angular.element($window);
        $('#mobile-nav').css("width",w.width() + "px")

        w.bind('resize', function () {
            if (w.width() > 767) {
                $('#wrapper').removeClass('toggled');
                $('#searchBar').hide();
                $rootScope.$broadcast('size', w.width());
            } else {
                $rootScope.$broadcast('size', w.width());
            }

            $('#mobile-nav').css("width",w.width() + "px")
        });

        $rootScope.toggle = function() {
            $('#wrapper').toggleClass('toggled');
            $rootScope.turnOffSearch();
        }

        $rootScope.toggleSearch = function() {
            $('#searchBar').slideToggle( "slow");
            $('#wrapper').removeClass('toggled');
        }

        $rootScope.toggleAlerts = function() {
            $('#alertsBar').slideToggle( "slow");
            $('#wrapper').removeClass('toggled');
        }

        $rootScope.turnOffSearch = function() {
            $('#searchBar').hide();
        }

        $rootScope.turnOffIfMobile = function() {
            if ($( window ).width() <= 767)
            {
                $('#wrapper').removeClass('toggled');
                $rootScope.turnOffSearch();
            }
        }

        $rootScope.test_error = function() {
            a = b;
        }

        $rootScope.csv_report = function(org) {
            var url = '/api/1.0/properties/csvreport/'+org+'?'
            url += "token=" + $cookies.get('token')
            location.href = url;
        }

        $rootScope.marketSurvey = function (id, surveyid,options) {
            require([
                '/app/marketSurvey/marketSurveyController.js'
            ], function () {
                var modalInstance = $uibModal.open({
                    templateUrl: '/app/marketSurvey/marketSurvey.html?bust='+version,
                    controller: 'marketSurveyController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        id: function () {
                            return id;
                        },
                        surveyid: function () {
                            return surveyid;
                        },
                        options: function () {
                            return options;
                        },                        
                    }
                });

                modalInstance.result.then(function () {
                    //Send successfully
                }, function () {
                    //Cancel
                });
            });
        }


        $scope.alerts = function() {
            if ($rootScope.me.permissions.indexOf("Admin") > -1) {
                $scope.alertsAmenities();
                $scope.alertsAudits();
                $scope.alertsApprovedLists("OWNER", "owner", "Property: Owners");
                $scope.alertsApprovedLists("MANAGER", "management", "Property: Management");
            }
        };

        $scope.alertsApprovedLists = function(type, key, label) {
            $propertyService.getUnapproved(type, "total").then(function (response) {
                    var a = _.find($rootScope.notifications, function(x) {return x.key === key});
                    var total = response.data.data.UnapprovedListQuery.total;
                    if (a) {
                        a.count = total;

                        if (a.count === 0) {
                            _.remove($rootScope.notifications, function(x) {return x.key === key});
                        }
                    } else {
                        if (total) {
                            $rootScope.notifications.push({
                                key: key,
                                count: total,
                                label: label + ": ",
                                url: "#/unapproved?type=" + type,
                            });
                        }
                    }
                },
                function (error) {
                    toastr.error(error.data.errors[0].message);
                });
        };

        $scope.alertsAmenities = function() {
            $amenityService.search({active: true, unapproved: true}).then(function (response) {

                var a = _.find($rootScope.notifications, function(x) {return x.key == "amenities"});

                if (a) {
                    a.count = response.data.amenities.length;

                    if (a.count == 0) {
                        _.remove($rootScope.notifications, function(x) {return x.key == "amenities"});
                    }
                } else {
                    if (response.data.amenities.length) {
                        $rootScope.notifications.push({
                            key: "amenities",
                            count: response.data.amenities.length,
                            label: "Amenities: ",
                            url: "#/amenities",
                        });
                    }
                }
            },
            function(error) {
                if (error.status == 401) {
                    $rootScope.logoff();
                    return;
                }
            });

            window.setTimeout(function() {
                $scope.alertsAmenities();
            }, 120000);
        };
            $scope.alertsAudits = function() {
                $auditService.search({
                    limit: 1,
                    approved: false,
                    daterange: {
                        daterange: "Last 30 Days",
                    },
                    offset: moment().utcOffset(),
                }).then(function(response) {
                        var a = _.find($rootScope.notifications, function(x) {
                            return x.key == "audits";
                        });

                        if (a) {
                            a.count = response.data.pager.count;

                            if (a.count == 0) {
                                _.remove($rootScope.notifications, function(x) {
                                    return x.key == "audits";
                                });
                            }
                        } else {
                            if (response.data.pager.count) {
                                $rootScope.notifications.push({
                                    key: "audits",
                                    count: response.data.pager.count,
                                    label: "Data Integrity: ",
                                    url: "#/history?active=1",
                                });
                            }
                        }

                    },
                    function(error) {
                        if (error.status == 401) {
                            $rootScope.logoff();
                            return;
                        }
                    });

                window.setTimeout(function() {
                    $scope.alertsAudits();
                }, 120000);
            };

        $rootScope.isModalOpen = function(el) {
            return($(el).hasClass("open"));
        };

        $rootScope.bouncePopup = function(user) {
            var str  = '<b>Status:</b> Undeliverable<br>';

            str += '<B>Email:</B> ' + user.email + '<br>'

            str += '<B>Error:</B> ' + user.bounceReason + '<br>'

            if (user.bounceDate) {
                str += '<B>Last Attempt:</B> ' + moment(new Date(user.bounceDate)).format("MM/DD/YYYY HH:MM") + '<br>'
            }

            return str;
        };

        $rootScope.tooltips = {
            "address": "<b>Address</b> - <i>Property address</i>",
            "walkscore": "<b>Walk Score® - Walk Score</b> - <i>Walk Score measures the walk-ability of any address</i>",
            "transitscore": "<b>Walk Score® - Transit Score</b> - <i>Transit Score measures access to public transit</i>",
            "bikescore": "<b>Walk Score® - Bike Score</b> - <i>Bike Score measures whether a location is good for biking</i>",
            "phone": "<b>Phone</b> - <i>Property phone</i>",
            "constructionType": "<b>Construction</b> - <i>Type of construction</i>",
            "owner": "<b>Owner</b> - <i>Ownership group</i>",
            "management": "<b>Management</b> - <i>Management company</i>",
            "yearBuilt": "<b>Year Built</b> - <i>Year property was constructed (YOC)</i>",
            "weeklytraffic": "<b>Traffic Week</b> - <i>Number of tours/shows given to prospective tenants in last 7 days (week)",
            "weeklyleases": "<b>Leases / Week</b> - <i>Number of approved leases in the last 7 days (week), after cancellations and denials</i>",
            "units": "<b>Units</b> - <i>Total units</i>",
            "unitPercent": "<b>Units %</b> - <i>Number of Units / Total units * 100</i>",
            "sqft": "<b>Square Feet</b> - <i>The weighted average square footage. Example - if there were 25 units with 500 square feet, and 75 units with 1000, the weighted average sq ft value would be (25 x 500 + 75 x 1000) / 100 units = 875 sq ft</i>",
            "occupancy": "<b>Occupancy %</b> - <i>Percentage of property which is occupied</i>",
            "leased": "<b>Leased %</b> - <i>Percentage of property which is leased</i>",
            "atr": "<b>Apartments To Rent %</b> - <i>Apartments To Rent (Exposure) is calculated by adding vacant available units (units not leased) plus units on notice and dividing by total units of the property</i>",
            "renewal": "<b>Renewal %</b> - <i>Percentage of leases that have renewed (typically used by student housing)</i>",
            "rent": "<b>Rent</b> - <i>The weighted average monthly market rent. This is made up of base (minimum) floor plan market rents for a 12 month lease, before any concessions or discounts</i>",
            "rentsqft": "<b>Rent/Sqft</b> - <i>This is Rent divided by Sqft</i>",
            "rent0": "<b>Rent by # Bedrooms</b> - <i>This is Rent grouped by number of bedrooms</i>",
            "concessionsOneTime": "<b>One-Time Concessions</b> - <i>The one-time (upfront) concessions. Example - if there is a $500 look-and-lease discount for signing a 12 month lease</i>",
            "concessionsMonthly": "<b>Recurring Concessions</b> - <i>The recurring (monthly) concessions. Example - if concession is $100 off per month</i>",
            "runrate": "<b>Recurring Rent</b> - <i>This is Rent minus Recurring Concessions. Excludes One-Time Concessions.</i>",
            "runratesqft": "<b>Recurring Rent / Sqft</b> - <i>This is Recurring Rent divided by Sqft </i>",
            "concessions": "<b>Total Concessions</b> - <i>This is the sum of One Time Concessions and 12 months of Recurring Concessions</i>",
            "ner": "<b>Net Effective Rent</b> - <i>Net Effective Rent (NER) is Rent less Recurring Concession and (One-Time Concessions / 12)</i>",
            "ner0": "<b>NER by # Bedrooms</b> - <i>Net Effective Rent grouped by number of bedrooms</i>",
            "nervscompavg": "<b>Net Effective Rent vs Comp Avg</b> - <i>Net Effective Rent divided by Comp average Net Effective Rent</i>",
            "nerweek": "<b>Net Effective Rent vs Last Week</b> - <i>Net Effective Rent divided by Last Week's Net Effective Rent</i>",
            "nermonth": "<b>Net Effective Rent vs Last Month</b> - <i>Net Effective Rent divided by Last Month's Net Effective Rent</i>",
            "neryear": "<b>Net Effective Rent vs Last Year</b> - <i>Net Effective Rent divided by Last Year's Net Effective Rent</i>",
            "nersqft": "<b>Net Effective Rent / Sqft</b> - <i>Net Effective Rent per Square Foot (NER divided by Sqft)</i>",
            "nersqftweek": "<b>Net Effective Rent / Sqft vs Last Week</b> - <i>Net Effective Rent / Sqft divided by Last Week's Net Effective Rent / Sqft</i>",
            "nersqftmonth": "<b>Net Effective Rent / Sqft vs Last Month</b> - <i>Net Effective Rent / Sqft divided by Last Month's Net Effective Rent / Sqft</i>",
            "nersqftyear": "<b>Net Effective Rent / Sqft vs Last Year</b> - <i>Net Effective Rent / Sqft divided by Last Year's Net Effective Rent / Sqft</i>",
            "nersqftvscompavg": "<b>Net Effective Rent/Sqft vs Comp Avg</b> - <i>Net Effective Rent / Sqft divided by Comp average Net Effective Rent / Sqft</i>",
            "last_updated": "<b>Last Updated</b> - <i>The date of the last survey completed for that property</i>",
        };
    }]);

