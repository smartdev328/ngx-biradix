'use strict';
angular.module('biradix.global').factory('$ssoService', ['$http','$cookies', function ($http,$cookies) {
    var fac = {};

    fac.getOrganizationSSOSettings = function (organizationid) {
        return new Promise(function (resolve, reject) {
            var response = {
                data: {
                    organization: fac.organizations.find(function (item, index) {
                        return item._id == organizationid;
                    }),
                }
            }
            resolve(response);
        });
    }

    fac.updateOrganizationSSOSettings = function (orgid, sso) {
        return new Promise(function (resolve, reject) {
            var index = fac.organizations.findIndex(function (item, index) {
                return item._id == orgid;
            });
            fac.organizations[index] = {
                ...fac.organizations[index],
                sso: {
                    ...sso,
                },
            };
            resolve();
        });
    }

    fac.getUsers = function (orgid) {
        return new Promise(function (resolve, reject) {
            var index = fac.users.findIndex(function (item, index) {
                return item.orgid == orgid;
            });
            var response = {
                data: {
                    users: fac.users[index].users,
                }
            };
            resolve(response);
        });
    }

    fac.updateUsers = function (orgid, users) {
        return new Promise(function (resolve, reject) {
            var index = fac.users.findIndex(function (item, index) {
                return item.orgid == orgid;
            });
            fac.users[index].users = fac.users[index].users.map(function (item, index) {
                var updateUser = users.find(function (user, userIndex) {
                    return user._id == item._id;
                });
                return {
                    ...item,
                    sso: updateUser.sso,
                };
            });
            resolve();
        });
    }

    fac.organizations = [
        {
            _id: "5cc72e94545c3400152a614a",
            name: "Alliance Residential",
            sso: {
                default: true,
                system: 'okta',
            }
        },
        {
            _id: "5cc72e94545c3400152a6149",
            name: "BI:Radix",
            sso: {
                default: false,
                system: undefined,
            }
        },
        {
            _id: "5cc72e94545c3400152a614b",
            name: "Demo Residential",
            sso: {
                default: true,
                system: 'okta',
            }
        },
        {
            _id: "5cc72e94545c3400152a614d",
            name: "Greystar",
            sso: {
                default: false,
                system: undefined,
            }
        },
        {
            _id: "5cc72e94545c3400152a614c",
            name: "Wood Residential",
            sso: {
                default: true,
                system: 'azure',
            }
        }
    ];
    fac.users = [
        {
            orgid: "5cc72e94545c3400152a614a",
            users: [
                {
                    _id: "5ceeca4f1552455d9881bb01",
                    email: "example1@biradix.com",
                    name: "Example 1",
                    sso: true,
                },
                {
                    _id: "5ceeca4f1552455d9881bb02",
                    email: "example2@biradix.com",
                    name: "Example 2",
                    sso: true,
                },
                {
                    _id: "5ceeca4f1552455d9881bb03",
                    email: "example3@biradix.com",
                    name: "Example 3",
                    sso: true,
                },
                {
                    _id: "5ceeca4f1552455d9881bb04",
                    email: "example4@biradix.com",
                    name: "Example 4",
                    sso: true,
                },
                {
                    _id: "5ceeca4f1552455d9881bb05",
                    email: "example5@biradix.com",
                    name: "Example 5",
                    sso: true,
                },
            ],
        },
        {
            orgid: "5cc72e94545c3400152a6149",
            users: [
                {
                    _id: "5ceeca4f1552455d9881bb11",
                    email: "example1@biradix.com",
                    name: "Example 11",
                    sso: true,
                },
                {
                    _id: "5ceeca4f1552455d9881bb12",
                    email: "example2@biradix.com",
                    name: "Example 12",
                    sso: true,
                },
                {
                    _id: "5ceeca4f1552455d9881bb13",
                    email: "example3@biradix.com",
                    name: "Example 13",
                    sso: true,
                },
                {
                    _id: "5ceeca4f1552455d9881bb14",
                    email: "example14@biradix.com",
                    name: "Example 14",
                    sso: true,
                },
                {
                    _id: "5ceeca4f1552455d9881bb15",
                    email: "example15@biradix.com",
                    name: "Example 15",
                    sso: true,
                },
            ],
        }
    ];
    return fac;
}]);
