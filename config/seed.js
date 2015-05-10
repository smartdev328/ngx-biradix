var async = require("async");
var UserSchema = require('../api/users/schemas/userSchema')
var AccessService = require('../api/access/services/accessService')
var UserService = require('../api/users/services/userService')
var OrgService = require('../api/organizations/services/organizationService')

module.exports = {
    init: function () {
        UserSchema.findOne({},function(err, usr) {
            if (!usr) {
                async.waterfall([
                    function(callbackw){
                        AdminCreate(function(admin) {
                            callbackw(null,admin)
                        });
                    },
                    function(admin, callbackw) {
                        CompaniesCreate(function(Biradix, Alliance, Demo, Wood, Greystar) {
                            callbackw(null,admin, Biradix, Alliance, Demo, Wood, Greystar)
                        })
                    },
                    function(admin, Biradix, Alliance, Demo, Wood, Greystar, callbackw) {
                        RolesCreate(Biradix, Alliance, Demo, Wood, Greystar, function(adminRole) {
                            callbackw(null,admin, adminRole)
                        })
                    },
                    function(admin, adminRole, callbackw) {
                        AdminMembership(admin,adminRole, function() {
                            callbackw(null,admin, adminRole)
                        })
                    },

                ], function(err) {

                });
            }
        }) ;

    }
}


var AdminCreate = function(callback) {

    var user =  {};
    user.email = "eugene@biradix.com";
    user.password = "Testing21!";
    user.first = "Eugene";
    user.last = "Kobrinsky";

    UserService.insert(user, function(usr) {
            callback(usr)
        },
        function(errors) {
            throw("Unable to seed: "+ errors[0].msg);
        }
    );

}

var RolesCreate = function(Biradix, Alliance, Demo, Wood, Greystar, callback) {
    var Admin = {name: "Site Admin", isadmin: true, tags: ['Admin'], orgid : Biradix._id}
    var AllianceCM = {name: "Corporate Manager", tags: ['CM'], orgid : Alliance._id}
    var AllianceRM = {name: "Regional Manager", tags: ['RM'], orgid : Alliance._id}
    var AllianceBM = {name: "Business Manager", tags: ['BM'], orgid : Alliance._id}
    var AlliancePO = {name: "Property Owner", tags: ['PO'], orgid : Alliance._id}
    var DemoCM = {name: "Corporate Manager", tags: ['CM'], orgid : Demo._id}
    var DemoRM = {name: "Regional Manager", tags: ['RM'], orgid : Demo._id}
    var DemoBM = {name: "Business Manager", tags: ['BM'], orgid : Demo._id}
    var DemoPO = {name: "Property Owner", tags: ['PO'], orgid : Demo._id}
    var WoodCM = {name: "Corporate Manager", tags: ['CM'], orgid : Wood._id}
    var WoodRM = {name: "Regional Manager", tags: ['RM'], orgid : Wood._id}
    var WoodBM = {name: "Business Manager", tags: ['BM'], orgid : Wood._id}
    var WoodPO = {name: "Property Owner", tags: ['PO'], orgid : Wood._id}
    var GreystarCM = {name: "Corporate Manager", tags: ['CM'], orgid : Greystar._id}
    var GreystarRM = {name: "Regional Manager", tags: ['RM'], orgid : Greystar._id}
    var GreystarBM = {name: "Business Manager", tags: ['BM'], orgid : Greystar._id}
    var GreystarPO = {name: "Property Owner", tags: ['PO'], orgid : Greystar._id}

    async.parallel([
        function(callbackp) {
            AccessService.createRole(Admin, function(err, role){
                Admin = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(AllianceCM, function(err, role){
                AllianceCM = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(AllianceRM, function(err, role){
                AllianceRM = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(AllianceBM, function(err, role){
                AllianceBM = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(AlliancePO, function(err, role){
                AlliancePO = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(DemoCM, function(err, role){
                DemoCM = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(DemoRM, function(err, role){
                DemoRM = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(DemoBM, function(err, role){
                DemoBM = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(DemoPO, function(err, role){
                DemoPO = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(WoodCM, function(err, role){
                WoodCM = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(WoodRM, function(err, role){
                WoodRM = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(WoodBM, function(err, role){
                WoodBM = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(WoodPO, function(err, role){
                WoodPO = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(GreystarCM, function(err, role){
                GreystarCM = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(GreystarRM, function(err, role){
                GreystarRM = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(GreystarBM, function(err, role){
                GreystarBM = role;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(GreystarPO, function(err, role){
                GreystarPO = role;
                callbackp(null)
            });
        },
    ],function(err) {callback(Admin)})


}

var AdminMembership = function(AdminUser, AdminRole, callback) {

    var member = {userid: AdminUser._id, roleid: AdminRole._id};

    AccessService.assignMembership(member, function(err, obj) {
        if (err) {
            throw("Unable to seed: "+ err[0].msg);
        }
        callback();
    })
}

var CompaniesCreate = function(callback) {
    var Biradix = {name: "BI:Radix", subdomain: 'platform', logoBig: 'biradix.png', logoSmall: 'biradix-small.png', isDefault : true}
    var Demo = {name: "Demo Residential", subdomain: 'demo', logoBig: 'demo.png', logoSmall: 'demo-small.png'}
    var Greystar = {name: "Greystar", subdomain: 'greystar', logoBig: 'greystar.jpg', logoSmall: 'greystar-small.png'}
    var Wood = {name: "Wood Residential", subdomain: 'wood', logoBig: 'wood.png', logoSmall: 'wood-small.png'}
    var Alliance = {name: "Alliance Residential", subdomain: 'alliance', logoBig: 'alliance.png', logoSmall: 'alliance-small.png'}


    async.parallel([
        function(callbackp) {
            OrgService.create(Biradix, function(err, org){
                Biradix = org;
                callbackp(null)
            });
        },
        function(callbackp) {
            OrgService.create(Alliance, function(err, org){
                Alliance = org
                callbackp(err)
            });
        },
        function(callbackp) {
            OrgService.create(Demo, function(err, org){
                Demo = org;
                callbackp(err)
            });
        },
        function(callbackp) {
            OrgService.create(Wood, function(err, org){
                Wood = org
                callbackp(err)
            });
        },
        function(callbackp) {
            OrgService.create(Greystar, function(err, org){
                Greystar = org
                callbackp(err)
            });
        },
    ],function(err) {
        if (err) {
            throw Error(err);

        }
        callback(Biradix, Alliance, Demo, Wood, Greystar)
    })


}