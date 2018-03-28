"use strict";

const express = require("express");
const organizationService = require("../services/organizationService")
const AccessService = require("../../access/services/accessService")
const Routes = new express.Router();
const serviceRegistry = require("../../../build/services/gateway/ServiceRegistry")

Routes.post("/", function(req, res) {
    AccessService.canAccess(req.user, "Admin", function(canAccess) {
        serviceRegistry.getOrganizationService().read({
            loggedInUser: req.user,
            webContext: req.context,
            criteria: {},
        }).then((response) => {
            return res.status(200).json({errors: null, organizations: response.data});
        }).catch((errors)=> {
            return res.status(200).json({errors: errors, organizations: null});
        });
    });
});

Routes.put("/:id/defaultSettings", function (req, res) {

    AccessService.canAccess(req.user,"Admin", function(canAccess) {

        if (!canAccess) {
            return res.status(401).json("Unauthorized request");
        }

        organizationService.defaultSettings(req.user, req.context, req.params.id, req.body,function (err, orgs) {
            res.status(200).json({errors: err});
        })
    });
});

module.exports = Routes;
