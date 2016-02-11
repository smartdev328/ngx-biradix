'use strict';
define([
    'app',
    '../../filters/skip/filter',
    '../../components/dialog/module'
], function (app) {

    app.controller('propertiesController', ['$scope','$rootScope','$location','$propertyService','ngProgress','$modal','$authService','$dialog','toastr', function ($scope,$rootScope,$location,$propertyService,ngProgress,$modal,$authService,$dialog,toastr) {
        if (!$rootScope.loggedIn) {
            $location.path('/login')
        }

        window.document.title = "Manage Properties | BI:Radix";

        $rootScope.nav = "";

        $rootScope.sideMenu = true;
        $rootScope.sideNav = "Properties";

        //Grid Options
        $scope.data = [];
        $scope.limits = [10,50,100,500]
        $scope.limit = 50;
        $scope.sort = {name:true}
        $scope.search = {}
        $scope.defaultSort = "-name";
        $scope.searchable = ['name', 'address', 'city', 'state', 'zip', 'company'];
        $scope.search['active'] = true;

        $scope.showInactive = false;
        $scope.showActive = true;
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
                active:  false,
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

        $scope.calcActive = function() {
            if ($scope.showActive === $scope.showInactive) {
                delete $scope.search.active;
            }
            else
            {
                $scope.search.active = $scope.showActive;
            }

            $scope.resetPager();
        }
        $scope.toggleOpen = function(row) {
            row.open = !(row.open || false);

            if (row.open) {
                row.fullcomps = [];

                row.compsLoaded = false;

                var compids = _.remove(_.pluck(row.comps, "id"), function(p) { return p.toString() != row._id.toString()});

                $propertyService.search({limit: 1000, permission: 'PropertyView', select:"_id name address city state zip active date totalUnits survey.occupancy survey.ner orgid", ids: compids}).then(function (response) {
                    row.fullcomps = response.data.properties;

                    row.fullcomps.forEach(function(p) {
                        //For propert sorting
                        if (p.survey){
                            if (p.survey.occupancy != null) {
                                p.occupancy = p.survey.occupancy;
                            }

                            if (p.survey.ner != null) {
                                p.ner = p.survey.ner;
                            }

                        } else {
                            p.occupancy = -1;
                            p.ner = -1;
                        }
                    })

                    row.compsLoaded = true;
                })

            }

        }
        /////////////////////////////
        $scope.reload = function (callback) {
            $scope.localLoading = false;
            $propertyService.search({limit: 1000, permission: 'PropertyManage', select:"_id name address city state zip active date totalUnits survey.occupancy survey.ner orgid comps.id comps.excluded"}).then(function (response) {
                $scope.data = response.data.properties;

                $scope.data.forEach(function(p) {
                    //For propert sorting
                    if (p.survey){
                        if (p.survey.occupancy != null) {
                            p.occupancy = p.survey.occupancy;
                        }

                        if (p.survey.ner != null) {
                            p.ner = p.survey.ner;
                        }
                    } else {
                        p.occupancy = -1;
                        p.ner = -1;
                    }
                })
                $scope.localLoading = true;

                if (callback) {
                    callback();
                }
            }, function(error) {
                if (error.status == 401) {
                    $rootScope.logoff();
                    return;
                }

                $scope.localLoading = true;
            })
        }

        $scope.reload();

        $scope.$on('properties.excluded', function(event, id, compid, excluded) {
            var prop = _.find($scope.data, function(p) {return p._id == id.toString()});
            var comp = _.find(prop.comps, function(c) {return c.id.toString() == compid.toString()})
            comp.excluded = excluded;
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
                    row.push(r['survey.occupancy'] || '')
                }
                if ($scope.show.ner) {
                    row.push(r['survey.ner'] || '')
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

            $dialog.confirm('Are you sure you want to remove comp <b>"' + comp.name + '"</b> from subject <b>"' + property.name + '"</b>?', function() {

                ngProgress.start();

                $propertyService.unlinkComp(property._id, comp._id).then(function (response) {

                        if (response.data.errors) {
                            toastr.error(_.pluck(response.data.errors,'msg').join("<br>"));
                        }
                        else {
                            _.remove(property.comps, function(c) {return c.id.toString() == comp._id.toString() })
                            _.remove(property.fullcomps, function(c) {return c._id.toString() == comp._id.toString() })

                            toastr.success('Comp <b>"' + comp.name + '"</b> removed from <b>"' + property.name + '"</b> successfully.');
                        }

                        ngProgress.reset();
                    },
                    function (error) {
                        toastr.error("Unable to update property. Please contact the administrator.");
                        ngProgress.reset();
                    });

            }, function() {})
        }

        $scope.toggleActive = function (property) {

            $dialog.confirm('Are you sure you want to set "' + property.name + '" as ' + (!property.active ? "active" : "inactive") + '?', function() {
                ngProgress.start();

                $propertyService.setActive(!property.active, property._id).then(function (response) {

                        if (response.data.errors) {
                            toastr.error(_.pluck(response.data.errors,'msg').join("<br>"));
                        }
                        else {
                            property.active = !property.active;

                            if (property.active) {
                                toastr.success(property.name + " has been activated.");
                            } else {
                                toastr.warning(property.name + " has been de-activated. ");
                            }
                        }

                        ngProgress.reset();
                    },
                    function (error) {
                        toastr.error("Unable to update property. Please contact the administrator.");
                        ngProgress.reset();
                    });

            }, function() {})
        }

        $scope.editLink = function (subject, comp) {
            require([
                '/app/floorplanLinks/floorplanLinksController.js'
            ], function () {
                var modalInstance = $modal.open({
                    templateUrl: '/app/floorplanLinks/floorplanLinks.html?bust=' + version,
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

        $scope.edit = function (id, isComp, subject) {
            var subjectid = subject ? subject._id : null;

            require([
                '/app/propertyWizard/propertyWizardController.js'
            ], function () {
                var modalInstance = $modal.open({
                    templateUrl: '/app/propertyWizard/propertyWizard.html?bust='+version,
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
                        },
                        subjectid: function() {
                            return subjectid;
                        }
                    }
                });

                modalInstance.result.then(function (comp) {
                    //Send successfully
                    $scope.reload(function() {
                        //after we reload, we need to update the reference to our subject since it got new data from ajax

                        subject = _.find($scope.data, function(x) {
                            return x._id.toString() == subjectid
                        });

                        //if we successfully added a comp for a subject, toggle open the comps in the ui for the subject
                        if (isComp) {
                            if (subject.open) {
                                $scope.toggleOpen(subject);
                            }
                            $scope.toggleOpen(subject);
                        }
                    });
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

        $scope.hasExcluded = function(subj, comp) {
            var c = _.find(subj.comps, function(cm) {return cm.id.toString() == comp._id.toString()});
            return c.excluded || false;
        }

        $scope.addComp = function(subject) {
            if (!subject.open) {
                $scope.toggleOpen(subject);
            }

            require([
                '/app/findComp/findCompController.js'
            ], function () {
                var modalInstance = $modal.open({
                    templateUrl: '/app/findComp/findComp.html?bust=' + version,
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
                    toastr.success('<b>' + comp.name + "</b> has been added as a comp for <b>" + subject.name + "</b>.");
                }, function (from) {
                    //Cancel
                    if (from == "create") {
                        $scope.edit(null, true, subject)
                    }
                });
            });

        }


        $scope.manageUsers = function(property) {

            require([
                '/app/properties/manageUsersController.js'
            ], function () {
                var modalInstance = $modal.open({
                    templateUrl: '/app/properties/manageUsers.html?bust=' + version,
                    controller: 'manageUsersController',
                    size: "md",
                    keyboard: false,
                    backdrop: 'static',
                    resolve: {
                        property: function () {
                            return property;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    toastr.success("Users updated successfully");
                }, function (from) {
                    //Cancel
                });
            });
        }

    }]);
});