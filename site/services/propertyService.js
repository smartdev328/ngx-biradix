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

        fac.full = function (id,summary,bedrooms,daterange, show) {
            return $http.post('/api/1.0/properties/' + id + '/full', {
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

        fac.extractSeries = function(p, ks, ls, defaultMin, defaultMax, decinalPlaces, allComps, summary) {
            var series = [];
            var hasPoints = false;
            var comps = allComps;


            var lines = [];
            //summary, show first prop then averages series
            if (summary) {
                lines.push({key: ks[0], name: comps[0].name, prop: comps[0]._id})
                lines.push({key: ks[0], name: "Comp Averages", prop: 'averages'})
            }
            else
            //multiple series on 1 chart for subject
            if (ls.length > 0) {
                ks.forEach(function(k,i) {
                    lines.push({key: k, name: ls[i], prop: comps[0]._id})
                });
            }
            //compare to other props
            else {
                comps.forEach(function(c) {
                    lines.push({key: ks[0], name: c.name, prop: c._id})
                })
            }

            lines.forEach(function(c) {
                var s = {data:[], name: c.name, _max: 0,  _min: 99999, _last : 0};

                var data = [];
                if (p[c.prop] && p[c.prop][c.key]) {
                    data = p[c.prop][c.key];
                }

                if (data) {
                    data.forEach(function (point) {
                        var v = point.v;
                        v = Math.round(v * Math.pow(10, decinalPlaces)) / Math.pow(10, decinalPlaces)
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

                if (!summary && ls.length == 0 && series.length > 1) {
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


        var markerContent = function(property) {
            return "<div style='min-height:50px;min-width:150px'><a href='#/profile/" + property._id + "'>" + property.name + "</a><br />" + property.address + "</div>";
        }

        fac.parseDashboard = function(dashboard, summary) {

            var resp = {};

            resp.property = dashboard.property;
            resp.comps = dashboard.comps;

            resp.mapOptions = {
                loc: resp.property.loc,
                height: "300",
                width: "100%",
                printWidth: "300",
                points: [{
                    loc: resp.property.loc,
                    marker: 'apartment-3',
                    content: markerContent(resp.property)
                }]
            }

            resp.comps = _.sortBy(resp.comps, function (n) {

                if (n._id.toString() == resp.property._id.toString()) {
                    return "-1";
                }
                return n.name;
            })

            resp.comps.forEach(function (c, i) {
                if (c._id.toString() != resp.property._id.toString()) {
                    resp.mapOptions.points.push({
                        loc: c.loc,
                        marker: 'number_' + i,
                        content: markerContent(c)
                    })
                }
            })

            resp.bedrooms = [{value: -1, text: 'All'}]

            if (resp.comps[0].survey && resp.comps[0].survey.floorplans) {
                var includedFps = _.filter(resp.comps[0].survey.floorplans, function (x) {
                    return !x.excluded
                });

                var bedrooms = _.groupBy(includedFps, function (x) {
                    return x.bedrooms
                });

                for (var b in bedrooms) {
                    switch (b) {
                        case 0:
                            resp.bedrooms.push({value: 0, text: 'Studios'})
                            break;
                        default:
                            resp.bedrooms.push({value: b, text: b + ' Bdrs.'})
                            break;
                    }
                }

                _.sortBy(resp.bedrooms, function (x) {
                    return x.value
                })
            }

            resp.bedroom = _.find(resp.bedrooms, function(x) {return x.value == resp.selectedBedroom});

            if (!resp.bedroom) {
                resp.bedroom = resp.bedrooms[0];
            }

            resp.points = {excluded: dashboard.points.excluded};
            var ner = fac.extractSeries(dashboard.points, ['ner'],[],0,1000,0, resp.comps, summary);
            var occ = fac.extractSeries(dashboard.points, ['occupancy'],[],80,100,1, resp.comps, summary);

            resp.nerData = {height:300, printWidth:860, prefix:'$',suffix:'', title: 'Net Eff. Rent $', marker: true, data: ner.data, min: ner.min, max: ner.max};
            resp.occData = {height:300, printWidth:860, prefix:'',suffix:'%',title: 'Occupancy %', marker: false, data: occ.data, min: (summary ? occ.min : 80), max: (summary ? occ.max : 100)};

            return resp;
        }

        return fac;
    }]);
});