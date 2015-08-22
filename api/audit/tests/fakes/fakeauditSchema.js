module.exports = function() {

    var fac = {};

    fac.save = function(callback) {
        callback(null, this);
    }

    return fac;
}