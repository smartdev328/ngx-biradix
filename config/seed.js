var async = require("async");
var UserSchema = require('../api/users/schemas/userSchema')
var AccessService = require('../api/access/services/accessService')
var UserService = require('../api/users/services/userService')

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
    user.title = "Mr";

    UserService.insert(user, function(usr) {
            callback(usr)
        },
        function(errors) {
            throw("Unable to seed: "+ errors[0].msg);
        }
    );

}

var RolesCreate = function(callback) {
    var Admin = {name: "Admin", isadmin: true}
    var Teacher = {name: "Teacher", isadmin: false};
    var Student = {name: "Student", isadmin: false};


    async.parallel([
        function(callbackp) {
            AccessService.createRole(Admin, function(err, admin){
                Admin = admin;
                callbackp(null)
            });
        },
        function(callbackp) {
            AccessService.createRole(Teacher, function(){callbackp(null)});
        },
        function(callbackp) {
            AccessService.createRole(Student, function(){callbackp(null)});
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