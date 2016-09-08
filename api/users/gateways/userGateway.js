'use strict';

var express = require('express');
var _ = require('lodash');
var UtilityService=  require('../services/utilityService')
var UserService=  require('../services/userService')
var AccessService = require('../../access/services/accessService')
var AuditService = require('../../audit/services/auditService')
var settings = require('../../../config/settings')
var userCreateService = require('../services/userCreateService')
var userRoutes = express.Router();
var packages = require('../../../package.json');

userRoutes.post('/bounce', function (req, res) {

    req.body.forEach(function(b) {
        if (b.email && b.reason) {
            UserService.updateBounce(b.email, b.reason, function() {});
        }
    })

    res.status(200).json({ success: true });

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
    UserService.updateSettings(req.user, req.body, req.context, function (err, usr) {
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
    delete req.user.memberships;
    delete req.user.ip;
    delete req.user.useragent;

    UserService.getUserById(req.user._id, function(err, obj) {
        if (!obj) {
            return res.status(401).json("Unauthorized request");
        }

        obj = null;

        req.user.version = packages.version;
        res.status(200).json(req.user);
    })


})

userRoutes.post('/create', function (req, res) {
    //You must have access to the role you are creating a user for.
    //In the future we need to re-think it if we allow anyone to join
    AccessService.canAccessResource(req.user,req.body.roleids,'RoleAssign', function(canAccess) {
        if (!req.body.roleids || !canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        //Anyone going through the gateway gets their random password emailed to them
        req.body.emailPassword = true;
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

module.exports = userRoutes;


function getToken(usr, res) {
    UserService.getFullUser(usr, function(resp) {
        resp.user.version = packages.version;
        delete resp.operator;
        res.status(200).json(resp);
        resp = null;
        usr = null;
    })
}