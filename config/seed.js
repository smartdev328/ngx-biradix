var async = require("async");
var UserSchema = require('../api/users/schemas/userSchema')
var AccessService = require('../api/access/services/accessService')
var UserService = require('../api/users/services/userService')
var OrgService = require('../api/organizations/services/organizationService')
var PropertyService = require('../api/properties/services/propertyService')

module.exports = {
    init: function () {
        UserSchema.findOne({},function(err, usr) {
            if (!usr) {
                async.waterfall([
                    function(callbackw){
                        UsersCreate(function(users) {
                            callbackw(null,users)
                        });
                    },
                    function(users, callbackw) {
                        CompaniesCreate(function(companies) {
                            callbackw(null,users, companies)
                        })
                    },

                    function(users, companies, callbackw) {
                        RolesCreate(companies, function(roles) {
                            callbackw(null,users, companies, roles)
                        })
                    },
                    function(users, companies, roles, callbackw) {
                        PropertiesCreate(companies,function(properties) {
                            callbackw(null,users, roles, properties)
                        })
                    },
                    function(users, roles, properties, callbackw) {
                        PermissionsCreate(roles, properties, function() {
                            callbackw(null,users, roles, properties)
                        })
                    },
                    function(users, roles,properties,  callbackw) {
                        MembershipsCreate(users,roles, function() {
                            callbackw(null,users, roles, properties)
                        })
                    },

                ], function(err) {

                });
            }
        }) ;

    }
}

var PropertiesCreate = function(companies,callback) {
    var Aurelian = { name: 'Aurelian Apartments', address: '1418 N. Scottsdale Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 632-2596', owner: 'Rome', management: 'Rome', yearBuilt: 2007, orgid: companies.Demo._id}
    var Augustus = { name: 'Augustus Apartments', address: '7700 E. Roosevelt Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 821-6060', owner: 'Octavian Empire', management: 'Octavian Empire', yearBuilt: 2006, orgid: companies.Demo._id }
    var Nero = { name: 'Nero Palace', address: '2500 N. Hayden Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 782-6699', owner: 'Nero Residential Capital', management: 'Nero Residential', yearBuilt: 2006}
    var Marcus = { name: 'Marcus Aurelius Place', address: '7800 E. McDowell Rd.', city: 'Scottsdale', state: 'AZ', zip: '85257', phone: '(180) 786-3323', owner: 'Roman Residential Services', management: 'Roman Residential Services', yearBuilt: 2006, orgid: companies.Greystar._id}

    var Geta = { name: 'Geta Residential', address: '3500 N. Scottsdale Rd.', city: 'Scottsdale', state: 'AZ', zip: '85251', phone: '(180) 840-6655', owner: 'Colosseum Capital', management: 'Colosseum Properties', yearBuilt: 2006, orgid: companies.Greystar._id}
    var Titus = { name: 'Titus Place', address: '7700 E. Osborn St.', city: 'Scottsdale', state: 'AZ', zip: '85251', phone: '(180) 276-4310', owner: 'Titus Investments', management: 'Titus Investments', yearBuilt: 2007}
    var Probus = { name: 'Probus Properties', address: '7800 E. Camelback Rd.', city: 'Scottsdale', state: 'AZ', zip: '85251', phone: '(180) 457-8787', owner: 'Rome', management: 'Rome', yearBuilt: 2007}


    async.parallel({
            Aurelian: function (callbackp) {
                PropertyService.create(Aurelian, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Augustus: function (callbackp) {
                PropertyService.create(Augustus, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Nero: function (callbackp) {
                PropertyService.create(Nero, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Marcus: function (callbackp) {
                PropertyService.create(Marcus, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Geta: function (callbackp) {
                PropertyService.create(Geta, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Titus: function (callbackp) {
                PropertyService.create(Titus, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            },
            Probus: function (callbackp) {
                PropertyService.create(Probus, function (err, prop) {
                        if (err) {
                            throw("Unable to seed: " + err[0].msg);
                        }
                        callbackp(null, prop)
                    }
                );
            }
        },function(err, props) {
            callback(props)
        }
    );


}
var UsersCreate = function(callback) {

    var System = {email : "admin@biradix.com", password: "$%%##FSDFSD", first : "System", last : "User", isSystem : true};
    var Eugene = {email : "eugene@biradix.com", password: "BIradix11!!", first : "Eugene", last : "K"};
    var Blerim = {email : "blerim@biradix.com", password: "BIradix11!!", first : "Blerim", last : "Z"};
    var Alex = {email : "alex@biradix.com", password: "BIradix11!!", first : "Alex", last : "V"};
    var Michelle = {email : "mbetchner@greystar.com", password: "Betchner321", first : "Michelle", last : "Betchner"};


    async.parallel({
            System: function(callbackp) {
                UserService.insert(System, function(usr) {
                        callbackp(null, usr)
                    },
                    function(errors) {
                        throw("Unable to seed: "+ errors[0].msg);
                    }
                );
            },
            Alex: function(callbackp) {
                UserService.insert(Alex, function(usr) {
                        callbackp(null, usr)
                    },
                    function(errors) {
                        throw("Unable to seed: "+ errors[0].msg);
                    }
                );
            },
            Eugene: function(callbackp) {
                UserService.insert(Eugene, function(usr) {
                        callbackp(null, usr)
                    },
                    function(errors) {
                        throw("Unable to seed: "+ errors[0].msg);
                    }
                );
            },
            Blerim: function(callbackp) {
                UserService.insert(Blerim, function(usr) {
                        callbackp(null, usr)
                    },
                    function(errors) {
                        throw("Unable to seed: "+ errors[0].msg);
                    }
                );
            },
            Michelle: function(callbackp) {
                UserService.insert(Michelle, function(usr) {
                        callbackp(null, usr)
                    },
                    function(errors) {
                        throw("Unable to seed: "+ errors[0].msg);
                    }
                );
            }
        },function(err, users) {
            callback(users)
        }
    );


}

var RolesCreate = function(Orgs, callback) {
    var BiradixAdmin = {name: "Site Admin", isadmin: true, tags: ['Admin'], orgid : Orgs.Biradix._id}
    var AllianceCM = {name: "Corporate Manager", tags: ['CM'], orgid : Orgs.Alliance._id}
    var AllianceRM = {name: "Regional Manager", tags: ['RM'], orgid : Orgs.Alliance._id}
    var AllianceBM = {name: "Business Manager", tags: ['BM'], orgid : Orgs.Alliance._id}
    var AlliancePO = {name: "Property Owner", tags: ['PO'], orgid : Orgs.Alliance._id}
    var DemoCM = {name: "Corporate Manager", tags: ['CM'], orgid : Orgs.Demo._id}
    var DemoRM = {name: "Regional Manager", tags: ['RM'], orgid : Orgs.Demo._id}
    var DemoBM = {name: "Business Manager", tags: ['BM'], orgid : Orgs.Demo._id}
    var DemoPO = {name: "Property Owner", tags: ['PO'], orgid : Orgs.Demo._id}
    var WoodCM = {name: "Corporate Manager", tags: ['CM'], orgid : Orgs.Wood._id}
    var WoodRM = {name: "Regional Manager", tags: ['RM'], orgid : Orgs.Wood._id}
    var WoodBM = {name: "Business Manager", tags: ['BM'], orgid : Orgs.Wood._id}
    var WoodPO = {name: "Property Owner", tags: ['PO'], orgid : Orgs.Wood._id}
    var GreystarCM = {name: "Corporate Manager", tags: ['CM'], orgid : Orgs.Greystar._id}
    var GreystarRM = {name: "Regional Manager", tags: ['RM'], orgid : Orgs.Greystar._id}
    var GreystarBM = {name: "Business Manager", tags: ['BM'], orgid : Orgs.Greystar._id}
    var GreystarPO = {name: "Property Owner", tags: ['PO'], orgid : Orgs.Greystar._id}

    async.parallel({
        BiradixAdmin: function(callbackp) {
            AccessService.createRole(BiradixAdmin, function(err, role){
                callbackp(null, role)
            });
        },
        AllianceCM: function(callbackp) {
            AccessService.createRole(AllianceCM, function(err, role){
                callbackp(null, role)
            });
        },
        AllianceRM: function(callbackp) {
            AccessService.createRole(AllianceRM, function(err, role){
                callbackp(null, role)
            });
        },
        AllianceBM: function(callbackp) {
            AccessService.createRole(AllianceBM, function(err, role){
                callbackp(null, role)
            });
        },
        AlliancePO: function(callbackp) {
            AccessService.createRole(AlliancePO, function(err, role){
                callbackp(null, role)
            });
        },
        DemoCM: function(callbackp) {
            AccessService.createRole(DemoCM, function(err, role){
                callbackp(null, role)
            });
        },
        DemoRM: function(callbackp) {
            AccessService.createRole(DemoRM, function(err, role){
                callbackp(null, role)
            });
        },
        DemoBM: function(callbackp) {
            AccessService.createRole(DemoBM, function(err, role){
                callbackp(null, role)
            });
        },
        DemoPO: function(callbackp) {
            AccessService.createRole(DemoPO, function(err, role){
                callbackp(null, role)
            });
        },
        WoodCM: function(callbackp) {
            AccessService.createRole(WoodCM, function(err, role){
                callbackp(null, role)
            });
        },
        WoodRM: function(callbackp) {
            AccessService.createRole(WoodRM, function(err, role){
                callbackp(null, role)
            });
        },
        WoodBM: function(callbackp) {
            AccessService.createRole(WoodBM, function(err, role){
                callbackp(null, role)
            });
        },
        WoodPO: function(callbackp) {
            AccessService.createRole(WoodPO, function(err, role){
                callbackp(null, role)
            });
        },
        GreystarCM: function(callbackp) {
            AccessService.createRole(GreystarCM, function(err, role){
                callbackp(null, role)
            });
        },
        GreystarRM: function(callbackp) {
            AccessService.createRole(GreystarRM, function(err, role){
                callbackp(null, role)
            });
        },
        GreystarBM: function(callbackp) {
            AccessService.createRole(GreystarBM, function(err, role){
                callbackp(null, role)
            });
        },
        GreystarPO: function(callbackp) {
            AccessService.createRole(GreystarPO, function(err, role){
                callbackp(null, role)
            });
        }
},function(err, roles) {callback(roles)})


}

var MembershipsCreate = function(Users, Roles, callback) {

    var System = {userid: Users.System._id, roleid: Roles.BiradixAdmin._id};
    var Alex = {userid: Users.Alex._id, roleid: Roles.BiradixAdmin._id};
    var Eugene = {userid: Users.Eugene._id, roleid: Roles.BiradixAdmin._id};
    var Blerim = {userid: Users.Blerim._id, roleid: Roles.BiradixAdmin._id};
    var Michelle = {userid: Users.Michelle._id, roleid: Roles.GreystarCM._id};

    async.parallel([
        function (callbackp) {
            AccessService.assignMembership(System, function(err, obj) {
                if (err) {
                    throw("Unable to seed: "+ err[0].msg);
                }
                callbackp();
            })
        },
        function (callbackp) {
            AccessService.assignMembership(Alex, function(err, obj) {
                if (err) {
                    throw("Unable to seed: "+ err[0].msg);
                }
                callbackp();
            })
        },
        function (callbackp) {
            AccessService.assignMembership(Eugene, function(err, obj) {
                if (err) {
                    throw("Unable to seed: "+ err[0].msg);
                }
                callbackp();
            })
        },
        function (callbackp) {
            AccessService.assignMembership(Blerim, function(err, obj) {
                if (err) {
                    throw("Unable to seed: "+ err[0].msg);
                }
                callbackp();
            })
        },
        function (callbackp) {
            AccessService.assignMembership(Michelle, function(err, obj) {
                if (err) {
                    throw("Unable to seed: "+ err[0].msg);
                }
                callbackp();
            })
        }
    ], function() {
        callback();
    })


}

var CompaniesCreate = function(callback) {
    var Biradix = {name: "BI:Radix", subdomain: 'platform', logoBig: 'biradix.png', logoSmall: 'biradix-small.png', isDefault : true}
    var Demo = {name: "Demo Residential", subdomain: 'demo', logoBig: 'demo.png', logoSmall: 'demo-small.png'}
    var Greystar = {name: "Greystar", subdomain: 'greystar', logoBig: 'greystar.jpg', logoSmall: 'greystar-small.png'}
    var Wood = {name: "Wood Residential", subdomain: 'wood', logoBig: 'wood.png', logoSmall: 'wood-small.png'}
    var Alliance = {name: "Alliance Residential", subdomain: 'alliance', logoBig: 'alliance.png', logoSmall: 'alliance-small.png'}


    async.parallel({
        Biradix: function(callbackp)
    {
        OrgService.create(Biradix, function (err, org) {
            callbackp(err, org)
        });
    }
    ,
        Alliance: function (callbackp) {
        OrgService.create(Alliance, function (err, org) {
            callbackp(err, org)
        });
    }

    ,
        Demo: function (callbackp) {
        OrgService.create(Demo, function (err, org) {
            callbackp(err, org)
        });
    }

    ,
        Wood: function (callbackp) {
        OrgService.create(Wood, function (err, org) {
            callbackp(err, org)
        });
    }

    ,
        Greystar: function (callbackp) {
        OrgService.create(Greystar, function (err, org) {
            callbackp(err, org)
        });
    }


},function(err, orgs) {
        if (err) {
            throw Error(err);

        }
        callback(orgs)
    })


}

var PermissionsCreate = function(roles, properties, callback) {

    var permissions = [
        {executorid: roles.BiradixAdmin._id, resource: "Users/LogInAs", allow: true, type: 'Execute'},

        {executorid: roles.GreystarCM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.GreystarBM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.GreystarCM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.GreystarBM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.GreystarCM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.GreystarBM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.GreystarCM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.GreystarCM._id, resource: "Settings/Default", allow: true, type: 'Execute'},
        {executorid: roles.GreystarCM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.GreystarRM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.GreystarBM._id, resource: "Properties", allow: true, type: 'Execute'},

        {executorid: roles.AllianceCM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.AllianceBM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.AllianceCM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.AllianceBM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.AllianceCM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.AllianceBM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.AllianceCM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.AllianceCM._id, resource: "Settings/Default", allow: true, type: 'Execute'},
        {executorid: roles.AllianceCM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.AllianceRM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.AllianceBM._id, resource: "Properties", allow: true, type: 'Execute'},

        {executorid: roles.WoodCM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.WoodBM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.WoodCM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.WoodBM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.WoodCM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.WoodBM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.WoodCM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.WoodCM._id, resource: "Settings/Default", allow: true, type: 'Execute'},
        {executorid: roles.WoodCM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.WoodRM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.WoodBM._id, resource: "Properties", allow: true, type: 'Execute'},

        {executorid: roles.DemoCM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.DemoBM._id, resource: "Users", allow: true, type: 'Execute'},
        {executorid: roles.DemoCM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.DemoBM._id, resource: "History", allow: true, type: 'Execute'},
        {executorid: roles.DemoCM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.DemoBM._id, resource: "Users/UpdateEmail", allow: true, type: 'Execute'},
        {executorid: roles.DemoCM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "Users/Deactivate", allow: true, type: 'Execute'},
        {executorid: roles.DemoCM._id, resource: "Settings/Default", allow: true, type: 'Execute'},
        {executorid: roles.DemoCM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.DemoRM._id, resource: "Properties", allow: true, type: 'Execute'},
        {executorid: roles.DemoBM._id, resource: "Properties", allow: true, type: 'Execute'},
    ];

    async.eachLimit(permissions, 10, function(permission, callbackp){
        AccessService.createPermission(permission, function (err, perm) {
            callbackp(err, perm)
        });
    }, function(err) {
        callback();
    });




}

