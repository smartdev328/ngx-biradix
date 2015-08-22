var should = require('chai').should()
var expect = require('chai').expect
var _ = require("lodash")
var mock = require('mock-require');
mock('../schema/auditSchema', './fakes/fakeauditSchema');
var auditService = require("../services/auditService")

describe('auditService', function() {
    describe('audits', function() {
        it('should contain login_succeeded', function() {
            var audit_item = _.filter(auditService.audits, function(x) {return x.id == "login_succeeded"});
            should.exist(audit_item);
        })
    })

    describe('create', function() {
        var audit = {operator: {id: 1, name: "test"}}
        auditService.create(audit, function(err, obj) {
            it('should return back a created object', function() {
                should.exist(obj);
            });

            it('should set operator', function() {
                expect(obj.operator.id).to.equal(1);
                expect(obj.operator.name).to.equal("test");
            });

            it('should set date to now', function() {
                expect(obj.date).to.not.be.an("undefined");
            });
        })
    })
})