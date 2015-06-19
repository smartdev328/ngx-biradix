'use strict';
define(['app'], function (app) {
    app.factory('$propertyService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.profile = function (id,daterange,show) {
            return $http.post('/api/1.0/properties/' + id + '/profile', {
                daterange:daterange,
                offset: moment().utcOffset(),
                show: show
            },  {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.getSurvey = function (id, surveyid) {
            return $http.get('/api/1.0/properties/' + id + '/survey/' + surveyid, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.dashboard = function (id,summary,bedrooms,daterange, show) {
            return $http.post('/api/1.0/properties/' + id + '/dashboard', {
                summary: summary,
                bedrooms: bedrooms,
                daterange:daterange,
                offset: moment().utcOffset(),
                show: show
            }, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.search = function (criteria) {
            return $http.post('/api/1.0/properties', criteria, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.setActive = function (active, userId) {
            return $http.put('/api/1.0/properties/' + userId + '/active', { active: active}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.lookups = function () {
            return $http.get('/api/1.0/properties/lookups', {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.unlinkComp = function (propertyid, compid) {
            return $http.delete('/api/1.0/properties/' + propertyid + '/comps/' + compid, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.saveCompLink = function (propertyid, compid, floorplans, excluded) {
            return $http.post('/api/1.0/properties/' + propertyid + '/comps/' + compid, {floorplans: floorplans, excluded : excluded}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.linkComp = function (propertyid, compid) {
            return $http.put('/api/1.0/properties/' + propertyid + '/comps/' + compid, {}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.createSurvey = function (propertyid, survey) {
            return $http.post('/api/1.0/properties/' + propertyid + '/survey', survey, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.floorplanName = function(fp) {
            var name = fp.bedrooms + "x" + fp.bathrooms;

            if (fp.description && fp.description != "") {
                name += " " + fp.description;
            } else {
                name += " - ";
            }

            name += " " + fp.sqft + " Sqft";
            name += ", " + fp.units + " Units";

            return name
        }

        fac.extractSeries = function(p, k, defaultMin, defaultMax, decinalPlaces, allComps, summary) {
            var series = [];
            var hasPoints = false;

            var comps = allComps;
            if (summary) {
                comps = _.take(allComps,1);
                comps.push({_id: "averages", name: "Comp Averages"})
            }

            comps.forEach(function(c) {
                var s = {data:[], name: c.name, _max: 0,  _min: 99999, _last : 0};

                if (p[c._id] && p[c._id][k]) {
                    var data = p[c._id][k];

                    data.forEach(function(point) {
                        var v = point.v;
                        v = Math.round(v * Math.pow(10,decinalPlaces)) / Math.pow(10,decinalPlaces)
                        if (s._max < v) {
                            s._max = v;
                        }

                        if (s._min > v) {
                            s._min = v;
                        }

                        hasPoints = true;

                        s._last = v;

                        s.data.push([point.d, v])
                    });

                }
                series.push(s)

            })


            if (hasPoints) {

                if (!summary) {
                    series = _.sortBy(series, function (x) {
                        return -x._last
                    })

                    series.forEach(function (x, i) {
                        x.name = (i + 1) + ". " + x.name
                    })
                }

                var min = _.min(series, function (x) {
                    return x._min
                })._min;
                var max = _.max(series, function (x) {
                    return x._max
                })._max;

            }
            else
            {
                min = defaultMin;
                max = defaultMax;
            }

            return {data: series, min: min, max: max};
        }

        return fac;
    }]);
});