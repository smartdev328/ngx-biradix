'use strict';
define([
    'app',
    '../../filters/skip/filter',
    '../../components/dialog/module'
], function (app) {

    app.controller('propertiesController', ['$scope','$rootScope','$location','$propertyService','ngProgress','$modal','$authService','$dialog', function ($scope,$rootScope,$location,$propertyService,ngProgress,$modal,$authService,$dialog) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        $rootScope.nav = "Properties";

        $rootScope.sideMenu = [];
        $rootScope.sideMenu.push({ label: "My Properties", href: '#/properties', active: true });
        //$rootScope.sideMenu.push({ label: "Preferences", href: '#/preferences', active: false });
        var siteAdmin = $rootScope.me.roles.indexOf('Site Admin') > -1;

        //Grid Options
        $scope.data = [];
        $scope.limits = [10,50,100,500]
        $scope.limit = 50;
        $scope.sort = {}
        $scope.search = {}
        $scope.filters = {active:true}
        $scope.defaultSort = "-name";
        $scope.searchable = ['name', 'address', 'city', 'state', 'zip', 'company'];
        $scope.search['active'] = true;

        $scope.adjustToSize = function(size) {
            var isTiny = size < 967;
            var isMedium  = size < 1167;
            $scope.show = {
                rownumber: false,
                date: false,
                name: true,
                address: !isTiny,
                city: !isMedium,
                state: !isMedium,
                zip: !isMedium,
                active:  !isTiny,
                totalUnits: true,
                occupancy: true,
                ner: !isMedium,
                company: false,
                tools : true
            }
        }

        $scope.adjustToSize($(window).width());

        $scope.$on('size', function(e,size) {
            if (!$scope.columnsChanged) {
                $scope.adjustToSize(size);
            }
        });

        $scope.toggleOpen = function(row) {
            row.open = !(row.open || false);

            if (row.open) {
                row.fullcomps = [];

                row.compsLoaded = false;

                var compids = _.remove(_.pluck(row.comps, "id"), function(p) { return p.toString() != row._id.toString()});

                $propertyService.search({limit: 1000, permission: 'PropertyView', select:"_id name address city state zip active date totalUnits occupancy ner orgid", ids: compids}).then(function (response) {
                    row.fullcomps = response.data.properties;
                    row.compsLoaded = true;
                })

            }

        }
        /////////////////////////////
        $scope.reload = function () {
            $scope.localLoading = false;
            $propertyService.search({limit: 1000, permission: 'PropertyManage', select:"_id name address city state zip active date totalUnits occupancy ner orgid comps.id"}).then(function (response) {
                $scope.data = response.data.properties;
                $scope.localLoading = true;
            })
        }

        $scope.reload();


        $scope.$on('data.reload', function(event, args) {
            $scope.reload();
        });

        $scope.resetPager = function () {
            $scope.currentPage = 1;
        }
        $scope.toggle = function (obj, v, reset) {
            var s = obj[v];

            if (reset) {
                for (var i in obj) {
                    if (i != v) {
                        delete obj[i];
                    }
                }
            }

            if (s === true) {
                obj[v] = false
                return;
            }

            if (s === false) {
                obj[v] = null
                return;
            }

            obj[v] = true;

        }

        $scope.searchFilter = function (obj) {
            if (!$scope.searchText) return true;
            var re = new RegExp($scope.searchText, 'i');

            var ret = false;
            $scope.searchable.forEach(function (x) {
                if (re.test((obj[x] || '').toString())) {
                    ret = true;
                }
            })
            return ret;
        };

        $scope.toggleFilter = function (v) {
            $scope.resetPager();
            $scope.toggle($scope.filters, v, false)
            var s = $scope.filters[v];

            $scope.search = $scope.search || {}
            if (s == null) {
                delete $scope.search[v];
                return;
            }

            $scope.search[v] = s;

        }
        $scope.toggleSort = function (v) {
            $scope.resetPager();
            $scope.toggle($scope.sort, v, true)

            var s = $scope.sort[v];

            if (s == null) {
                $scope.orderBy = $scope.defaultSort;
                return;
            }

            if (s == true) {
                $scope.orderBy = "-" + v;
            }
            else {
                $scope.orderBy = v;
            }

        }

        $scope.pageStart = function () {
            if ($scope.filtered.length == 0) return 0;
            return (($scope.currentPage || 1) - 1) * parseInt($scope.limit) + 1;
        }

        $scope.pageEnd = function () {
            if ($scope.filtered.length == 0) return 0;
            var x = $scope.pageStart() - 1 + parseInt($scope.limit);

            if (x > $scope.filtered.length) {
                x = $scope.filtered.length;
            }

            return parseInt(x);
        }


        $scope.streamCsv = function (filename, content) {
            var finalVal = '';

            for (var i = 0; i < content.length; i++) {
                var value = content[i];

                for (var j = 0; j < value.length; j++) {
                    var innerValue = value[j].toString();
                    var result = innerValue.replace(/"/g, '""');
                    if (result.search(/("|,|\n)/g) >= 0)
                        result = '"' + result + '"';
                    if (j > 0)
                        finalVal += ',';
                    finalVal += result;
                }

                finalVal += '\n';
            }

            var pom = document.createElement('a');
            pom.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(finalVal));
            pom.setAttribute('download', filename);
            pom.click();
        }

        $scope.download = function () {
            var content = [];
            var header = [];
            if ($scope.show.date) {
                header.push('Date')
            }
            if ($scope.show.name) {
                header.push('Name')
            }
            if ($scope.show.address) {
                header.push('Address')
            }
            if ($scope.show.city) {
                header.push('City')
            }
            if ($scope.show.state) {
                header.push('State')
            }
            if ($scope.show.zip) {
                header.push('Zip')
            }
            if ($scope.show.totalUnits) {
                header.push('Units')
            }
            if ($scope.show.occupancy) {
                header.push('Occupancy')
            }
            if ($scope.show.ner) {
                header.push('Net Effective Rent')
            }
            if ($scope.show.active) {
                header.push('Active')
            }
            if ($scope.show.company) {
                header.push('Company')
            }
            content.push(header);
            $scope.filtered.forEach(function (r) {
                var row = [];
                if ($scope.show.date) {
                    row.push(r['date'])
                }
                if ($scope.show.name) {
                    row.push(r['name'])
                }
                if ($scope.show.address) {
                    row.push(r['address'])
                }
                if ($scope.show.city) {
                    row.push(r['city'])
                }
                if ($scope.show.state) {
                    row.push(r['state'])
                }
                if ($scope.show.zip) {
                    row.push(r['zip'])
                }
                if ($scope.show.totalUnits) {
                    row.push(r['totalUnits'] || '')
                }
                if ($scope.show.occupancy) {
                    row.push(r['occupancy'] || '')
                }
                if ($scope.show.ner) {
                    row.push(r['ner'] || '')
                }
                if ($scope.show.active) {
                    row.push(r['active'] ? 'Yes' : 'No')
                }
                if ($scope.show.company) {
                    row.push(r['company'] || '')
                }
                content.push(row);
            })

            $scope.streamCsv('properties.csv', content)

        }

        $scope.unlinkComp = function (property, comp) {

            $dialog.confirm('Are you sure you want to unlink Comp "' + comp.name + '" from Subject "' + property.name + '"?', function() {
                $scope.alerts = [];

                ngProgress.start();

                $propertyService.unlinkComp(property._id, comp._id).then(function (response) {

                        if (response.data.errors) {
                            $scope.alerts.push({ type: 'danger', msg: _.pluck(response.data.errors,'msg').join("<br>") });
                        }
                        else {
                            _.remove(property.comps, function(c) {return c.id.toString() == comp._id.toString() })
                            _.remove(property.fullcomps, function(c) {return c._id.toString() == comp._id.toString() })

                            $scope.alerts.push({type: 'warning', msg: 'Comp "' + comp.name + '" unlinked from Subject "' + property.name + '" successfully.'});
                        }

                        ngProgress.reset();
                    },
                    function (error) {
                        $scope.alerts.push({ type: 'danger', msg: "Unable to update property. Please contact the administrator." });
                        ngProgress.reset();
                    });

            }, function() {})
        }

        $scope.toggleActive = function (property) {

            $dialog.confirm('Are you sure you want to set "' + property.name + '" as ' + (!property.active ? "active" : "inactive") + '?', function() {
                $scope.alerts = [];

                ngProgress.start();

                $propertyService.setActive(!property.active, property._id).then(function (response) {

                        if (response.data.errors) {
                            $scope.alerts.push({ type: 'danger', msg: _.pluck(response.data.errors,'msg').join("<br>") });
                        }
                        else {
                            property.active = !property.active;

                            if (property.active) {
                                $scope.alerts.push({type: 'success', msg: property.name + " has been activated."});
                            } else {
                                $scope.alerts.push({type: 'warning', msg: property.name + " has been de-activated. "});
                            }
                        }

                        ngProgress.reset();
                    },
                    function (error) {
                        $scope.alerts.push({ type: 'danger', msg: "Unable to update property. Please contact the administrator." });
                        ngProgress.reset();
                    });

            }, function() {})
        }

        $scope.editLink = function (subject, comp) {
            require([
                '/app/floorplanLinks/floorplanLinksController.js'
            ], function () {
                var modalInstance = $modal.open({
                    templateUrl: '/app/floorplanLinks/floorplanLinks.html',
                    controller: 'floorplanLinksController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        id: function () {
                            return subject._id;
                        },
                        compid: function() {
                            return comp._id;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    //Send successfully
                }, function () {
                    //Cancel
                });
            });
        }

        $scope.edit = function (id, isComp) {
            require([
                '/app/propertyWizard/propertyWizardController.js'
            ], function () {
                var modalInstance = $modal.open({
                    templateUrl: '/app/propertyWizard/propertyWizard.html',
                    controller: 'propertyWizardController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        id: function () {
                            return id;
                        },
                        isComp: function() {
                            return isComp;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    //Send successfully
                }, function () {
                    //Cancel
                });
            });
        }

        $scope.dashboard = function(id) {
            $rootScope.me.settings.defaultPropertyId = id;
            $authService.updateSettings($rootScope.me.settings).then(function() {
                $rootScope.refreshToken();
            });
            $location.path('/dashboard')
        }

        $scope.addComp = function(subject) {
            if (!subject.open) {
                $scope.toggleOpen(subject);
            }

            require([
                '/app/findComp/findCompController.js'
            ], function () {
                var modalInstance = $modal.open({
                    templateUrl: '/app/findComp/findComp.html',
                    controller: 'findCompController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        id: function () {
                            return subject._id;
                        }
                    }
                });

                modalInstance.result.then(function (comp) {
                    //Send successfully
                    subject.comps.push({id: comp._id});

                    if (subject.open) {
                        $scope.toggleOpen(subject);
                    }
                    $scope.toggleOpen(subject);
                    $scope.alerts = [];
                    $scope.alerts.push({type: 'success', msg: comp.name + " has been added as a Comp for " + subject.name + "."});
                }, function (from) {
                    //Cancel
                    if (from == "create") {
                        $scope.edit(null, true)
                    }
                });
            });
        }

    }]);
});