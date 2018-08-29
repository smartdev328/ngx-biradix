"use strict";

var express = require("express");
var _ = require("lodash");
var UtilityService = require("../services/utilityService");
var UserService = require("../services/userService");
var AccessService = require("../../access/services/accessService");
var PropertyService = require("../../properties/services/propertyService");
var AuditService = require("../../audit/services/auditService");
var settings = require("../../../config/settings");
var userCreateService = require("../services/userCreateService");
var userRoutes = new express.Router();
var packages = require("../../../package.json");
var async = require("async");
const EmailService = require("../../business/services/emailService");

userRoutes.post("/bounce", function (req, res) {
    req.body.forEach(function(b) {
        if (b.email && b.reason) {
            UserService.updateBounce(b.email, b.reason, function() {});

            // Need System User to look up guest
            UserService.getSystemUser((System) => {
                // Get user by email
               UserService.search(System.user, {email: b.email, select: "_id first last guestStats"}, (err, users) => {
                   // If user exists and they have guestStats, must be a guest
                   if (users && users.length === 1 && users[0].guestStats && users[0].guestStats.length > 0) {

                       // Sort their assigned comps by last emailed newest first, grab first
                       const last = _.sortBy(users[0].guestStats, (g) => {
                           return -1*g.lastEmailed ? (new Date(g.lastEmailed)).getTime() : 0;
                       })[0];

                       // if guest emailed, ready
                       if (last.lastEmailed) {
                           PropertyService.search(System.user, {_id: last.propertyid}, (error, properties) => {
                               const templateData = {
                                   contactEmail: b.email,
                                   property: properties[0].name,
                                   message: b.reason,
                                   admin_only: "",
                               };
                               let email = {
                                   to: last.sender.email,
                                   category: ["SurveySwap Undeliverable"],
                                   logo: "https://platform.biradix.com/images/organizations/" + last.sender.logo,
                                   subject: "Unable to reach SurveySwap contact (" + b.email + ") for " + properties[0].name,
                                   template: "surveyswap_bounced.html",
                                   templateData: templateData,
                               };

                               EmailService.send(email, (emailError, status) => {
                                   delete email.category;
                                   email.to = "surveyswapemails@biradix.com";
                                   email.templateData.admin_only = "<i>TO: " + last.sender.first + " " + last.sender.last + " &lt;" + last.sender.email + "&gt;</i><br><Br>";

                                   EmailService.send(email, function(emailError, status) {});
                               });
                           });
                       }
                   }
               });
            });
        }
    })

    res.status(200).json({success: true});

})

userRoutes.post('/resetPassword', function (req, res) {

    UserService.resetPassword(req.body.email, req.basePath, req.context, function(errors, success) {
            res.status(200).json({ errors: errors, success: success });
        }
    );

})

userRoutes.put('/me', function (req, res) {
    userCreateService.updateMe(req.user, req.context, req.body, function (err, usr) {
            if (err) {
                usr = null;
                return res.status(200).json({errors: err, user: null});
            }
            var user = UtilityService.getPublicJSON(usr);
            res.status(200).json({errors: err, user: user});
            user = null;
            usr = null;
        }
    );

})

userRoutes.put('/me/settings', function (req, res) {
    UserService.updateSettings(req.user, req.user, req.body, req.context, function (err, usr) {
            if (err) {
                return res.status(200).json({errors: err, user: null});
            }
            res.status(200).json({errors: err, user: UtilityService.getPublicJSON(usr)});
        }
    );

})

userRoutes.get('/refreshToken', function (req, res) {
    UserService.getUserById(req.user._id, function(err, usr) {
        if (err) {
            return res.status(200).json(err);
        }

        if (!usr) {
            return res.status(401).json("Unauthorized request");
        }

            getToken(usr, res);
        }
    );
})

userRoutes.post('/login', function (req, res) {
   var user =  {}
    user.email = req.body.email;
    user.password = req.body.password;

    UserService.login(user, req.context, function(usr) {
            getToken(usr, res);

        },
        function(errors) {
            res.status(200).json(errors);
        }
    );
})

userRoutes.get('/me', function (req, res) {
    //delete req.user.memberships;
    delete req.user.ip;
    delete req.user.useragent;

    UserService.getUserById(req.user._id, function(err, obj) {
        if (!obj) {
            return res.status(401).json("Unauthorized request");
        }

        obj = null;

        req.user.version = packages.version;
        req.user.maintenance = settings.MAINTENANCE_MODE;
        res.status(200).json(req.user);
    })


})

userRoutes.post('/createGuest', function (req, res) {
    //Anyone going through the gateway gets their random password emailed to them
    //Do not email guests
    req.body.emailPassword = false
    req.body.passwordUpdated = true
    req.body.isSystem = false;

    UserService.getSystemUser(function(System) {
        UserService.search(System.user, {email: req.body.email, select: "first last email"}, function(err,users) {
            if (users && users.length == 1 && users[0].roles[0].name == 'Guest') {
                AccessService.createPermission({executorid: req.user._id, resource: users[0]._id,type: 'UserManage'}, function() {
                    return res.status(201).json({errors: null, user: UtilityService.getPublicJSON(users[0])});
                });
            } else {
                AccessService.getOrgRoles({tags: ['Guest']}, function (err, guests) {
                    req.body.roleids = [guests[0]._id.toString()];

                    userCreateService.insert(req.user, req.context, req.body, req.basePath, function (errors, usr) {
                            if (errors) {
                                res.status(200).json({errors: errors, user: null});
                            }
                            else {
                                res.status(201).json({errors: null, user: UtilityService.getPublicJSON(usr)});
                            }
                        }
                    );
                })
            }
        })

    })
});

userRoutes.post('/create', function (req, res) {
    //You must have access to the role you are creating a user for.
    //In the future we need to re-think it if we allow anyone to join
    AccessService.canAccessResource(req.user,req.body.roleids,'RoleAssign', function(canAccess) {
        if (!req.body.roleids || !canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        //Anyone going through the gateway gets their random password emailed to them
        //Do not email guests
        req.body.emailPassword = !(req.body.isGuest || false) // If guest, dont email password
        req.body.passwordUpdated = (req.body.isGuest || false); // If Guest, mark password as updated, dont force update
        req.body.isSystem = false;

        userCreateService.insert(req.user, req.context, req.body, req.basePath, function (errors, usr) {
                if (errors) {
                    res.status(200).json({errors: errors, user: null});
                }
                else {
                    res.status(201).json({errors: null, user: UtilityService.getPublicJSON(usr)});
                }
            }
        );
    });
});

userRoutes.put('/:userid', function (req, res) {
    //You must have access to the role you are updating a user for.
    AccessService.canAccessResource(req.user,req.body.roleids,'RoleAssign', function(canAccess) {
        if (!req.body.roleids || !canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        userCreateService.update(req.user, req.context, null, req.body, function (errors, usr) {
                if (errors) {
                    res.status(200).json({errors: errors, user: null});
                }
                else {
                    res.status(201).json({errors: null, user: UtilityService.getPublicJSON(usr)});
                }
            }
        );
    });
});

userRoutes.post('/recover', function (req, res) {
    var token = req.body.token;

    UserService.getUserByRecoveryToken(token, function (usr) {
        if (usr) {
            return res.status(200).json({email: usr.email});
        } else {
            res.status(200).json({email: null});
        }
    })

})

userRoutes.post('/updatePassword', function (req, res) {
    UserService.updatePassword(req.user._id, req.body.newpassword, req.context, req.body.currentpassword, function(err, newusr) {
        if (err) {
            return res.status(200).json({success: false, errors: err});
        } else {
            return res.status(200).json({success: true});
        }
    })
})

userRoutes.post('/updatePasswordByToken', function (req, res) {
    var token = req.body.token;

    UserService.getUserByRecoveryToken(token, function (usr) {
        if (usr) {
            UserService.updatePassword(usr._id, req.body.password, req.context, null, function(err, newusr) {
                if (err) {
                    return res.status(200).json({success: false, errors: err});
                } else {
                    return res.status(200).json({success: true});
                }
            })
        } else {
            res.status(200).json({success: false});
        }
    })
})

userRoutes.post('/', function (req, res) {

    UserService.search(req.user, req.body, function(err, users) {

        if (err) {
            res.status(400).send(err)
        } else {
            res.status(200).json({users: users})
        }

        users = null;

    })

});

userRoutes.get('/loginAs/:userid', function (req, res) {
    AccessService.canAccess(req.user,"Users/LoginAs", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }
        UserService.search(req.user, {}, function (err, users) {

            var user = _.find(users, function (x) {
                return x._id.toString() == req.params.userid
            })

            UserService.getUserById(user._id, function (err, usr) {
                    if (err) {
                        return res.status(200).json(errors);
                    }

                    AuditService.create({type: 'login_as', operator: req.user, user: usr, description: usr.email, context: req.context})
                    getToken(usr, res);

                }
            );
        })
    });
})

userRoutes.put('/:id/customPropertiesLimit', function (req, res) {
    AccessService.canAccess(req.user,"Admin", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }
        var user = {};
        user.id = req.params.id;
        user.customPropertiesLimit = req.body.customPropertiesLimit;

        UserService.updateCustomPropertiesLimit(req.user, user, req.context, function (err, newusr) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true});
            }
        });
    })
})

userRoutes.put('/:id/active', function (req, res) {
    AccessService.canAccess(req.user,"Users/Deactivate", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }
        var user = {};
        user.id = req.params.id;
        user.active = req.body.active;

        UserService.updateActive(req.user, user, req.context,null, function (err, newusr) {
            if (err) {
                return res.status(200).json({success: false, errors: err});
            }
            else {
                return res.status(200).json({success: true});
            }
        });
    })
})

userRoutes.post('/getUsersForSettingsApply', function (req, res) {
    AccessService.canAccess(req.user,"Admin", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        UserService.getUsersForSettingsApply(req.user, req.body.orgid, req.body.setting, req.body.value, function (users) {
            return res.status(200).json({users: _.map(users, function(x) {return x.first + ' ' + x.last})});
        });
    })
});

userRoutes.post('/updateUsersForSettingsApply', function (req, res) {
    AccessService.canAccess(req.user,"Admin", function(canAccess) {
        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        UserService.getUsersForSettingsApply(req.user, req.body.orgid, req.body.setting, req.body.value, function (users) {
            var good = [];
            var bad = [];
            async.eachLimit(users, 10, function (user, callbackp) {

                UserService.updateSettings(req.user,user, user.settings, req.context, function(err, settings) {
                    if (err) {
                        bad.push(user.first + ' ' + user.last)
                    } else {
                        good.push(user.first + ' ' + user.last)
                    }

                    callbackp();
                });

            }, function (err) {
                return res.status(200).json({
                    good: good,
                    bad: bad
                });
            });
        });
    })
});

module.exports = userRoutes;


function getToken(usr, res) {
    UserService.getFullUser(usr, function(resp) {
        resp.user.version = packages.version;
        resp.user.maintenance = settings.MAINTENANCE_MODE;
        delete resp.operator;
        res.status(200).json(resp);
        resp = null;
        usr = null;
    })
}