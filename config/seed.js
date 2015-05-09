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
                        RolesCreate(function(adminRole) {
                            callbackw(null,admin, adminRole)
                        })
                    },
                    function(admin, adminRole, callbackw) {
                        AdminMembership(admin,adminRole, function() {
                            callbackw(null,admin, adminRole)
                        })
                    },
                    function(admin, adminRole, callbackw) {
                        BiradixCreate(function(Biradix) {
                            callbackw(null,admin, adminRole, Biradix)
                        })
                    }

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

var RolesCreate = function(callback) {
    var Admin = {name: "Site Admin", isadmin: true}


    async.parallel([
        function(callbackp) {
            AccessService.createRole(Admin, function(err, admin){
                Admin = admin;
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

var BiradixCreate = function(callback) {
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
                callbackp(null)
            });
        },
        function(callbackp) {
            OrgService.create(Demo, function(err, org){
                callbackp(null)
            });
        },
        function(callbackp) {
            OrgService.create(Wood, function(err, org){
                callbackp(null)
            });
        },
        function(callbackp) {
            OrgService.create(Greystar, function(err, org){
                callbackp(null)
            });
        },
    ],function(err) {
        callback(Biradix)
    })


}