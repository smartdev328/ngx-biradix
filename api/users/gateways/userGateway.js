'use strict';

var express = require('express');
var _ = require('lodash');
var UtilityService=  require('../services/utilityService')
var UserService=  require('../services/userService')
var AccessService = require('../../access/services/accessService')
var settings = require('../../../config/settings')


var userRoutes = express.Router();

userRoutes.post('/resetPassword', function (req, res) {
    UserService.resetPassword(req.body.email, "http://" + req.headers.host, function(success) {
            res.status(200).json({ success: success });
        }
    );

})

userRoutes.put('/me', function (req, res) {
    UserService.updateMe(req.user, req.body, function (err, usr) {
            if (err) {
                return res.status(200).json({errors: err, user: null});
            }
            res.status(200).json({errors: err, user: UtilityService.getPublicJSON(usr)});
        }
    );

})

userRoutes.put('/me/settings', function (req, res) {
    UserService.updateSettings(req.user, req.body, function (err, usr) {
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
                return res.status(200).json(errors);
            }
            getToken(usr, res);

        }
    );
})

userRoutes.post('/login', function (req, res) {
   var user =  {}
    user.email = req.body.email;
    user.password = req.body.password;

    UserService.login(user, function(usr) {
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
    res.status(200).json(req.user);
})

userRoutes.post('/create', function (req, res) {
    UserService.insert(req.body, function (usr) {
            res.status(201).json({errors: null, user: UtilityService.getPublicJSON(usr)});
        },
        function (errors) {
            res.status(200).json({errors: errors, user: null});
        }
    );
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

userRoutes.post('/updatePasswordByToken', function (req, res) {
    var token = req.body.token;

    UserService.getUserByRecoveryToken(token, function (usr) {
        if (usr) {
            UserService.updatePassword(usr._id, req.body.password, function(err, newusr) {
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
                    getToken(usr, res);

                }
            );
        })
    });
})

module.exports = userRoutes;


function getToken(usr, res) {
    UserService.getFullUser(usr, function(resp) {
        res.status(200).json(resp);
    })
}