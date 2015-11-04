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

        fac.create = function (property) {
            return $http.put('/api/1.0/properties', property, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.update = function (property) {
            return $http.put('/api/1.0/properties/' + property._id, property, {
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

        fac.updateSurvey = function (propertyid, surveyid, survey) {
            return $http.put('/api/1.0/properties/' + propertyid + '/survey/' + surveyid , survey, {
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

        var extractTableViews = function(surveys, occupancy, pts, nerColumns) {
            var table = [];

            occupancy.data[0].data.forEach(function(o) {
                var tr = _.find(pts['traffic'], function(x) {return x.d == o[0]})
                var ls = _.find(pts['leases'], function(x) {return x.d == o[0]})
                var surveyid = _.find(surveys, function(x,y) {return y == o[0]})

                if (!tr.f) {

                    var row = {d: o[0], occ: o[1], traffic: tr.v, leases: ls.v, surveyid: surveyid}

                    nerColumns.forEach(function (k) {
                        var n = _.find(pts[k], function (x) {
                            return x.d == o[0]
                        })

                        row[k] = n.v
                    })


                    table.push(row);
                }
            } )

            table = _.sortBy(table, function(x) {return -x.d})

            return table;

        }
        fac.parseProfile = function(profile, graphs) {

            var resp = {};
            resp.lookups = profile.lookups;

            if (!profile.property) {
                return null;
            } else {
                resp.property = profile.property;
                resp.canManage = profile.canManage;
                resp.owner = profile.owner;
                resp.comp = profile.comps[0];
            }

            resp.property.hasName = resp.property.contactName && resp.property.contactName.length > 0;
            resp.property.hasEmail = resp.property.contactEmail && resp.property.contactEmail.length > 0;
            resp.property.hasNotes = resp.property.notes && resp.property.notes.length > 0;
            resp.property.hasContact = resp.property.hasName || resp.property.hasEmail;
            resp.property.notes = (resp.property.notes || '').replace(/(?:\r\n|\r|\n)/g, '<br />');

            resp.property.hasFees = false;
            if (resp.property.fees) {
                for (var fee in resp.property.fees) {
                    if (resp.property.fees[fee].length > 0) {
                        resp.property.hasFees = true;
                    }
                }
            }

            resp.property.location_am = [];
            resp.property.location_amenities.forEach(function (la) {
                var am = _.find(resp.lookups.amenities, function (a) {
                    return a._id.toString() == la.toString()
                })
                if (am) {
                    resp.property.location_am.push(am.name)
                }
            })

            resp.property.community_am = [];
            resp.property.community_amenities.forEach(function (la) {
                var am = _.find(resp.lookups.amenities, function (a) {
                    return a._id.toString() == la.toString()
                })
                if (am) {
                    resp.property.community_am.push(am.name)
                }
            })

            resp.property.floorplan_am = [];
            resp.property.floorplans.forEach(function (fp) {
                fp.amenities.forEach(function (la) {
                    var am = _.find(resp.lookups.amenities, function (a) {
                        return a._id.toString() == la.toString()
                    })
                    if (am) {
                        if (resp.property.floorplan_am.indexOf(am.name) == -1)
                            resp.property.floorplan_am.push(am.name)
                    }
                })
            })

            resp.points = {excluded: profile.points.excluded};

            var keys = ['ner'];
            var labels = ['Entire Property'];

            var pts = profile.points[resp.property._id];

            if (pts) {
                for (var p in pts) {
                    if (!isNaN(p)) {
                        keys.push(p)
                        labels.push(p + ' Bedrooms')
                    }
                }

                resp.surveyData = pts.surveys;
            }


            var ner = fac.extractSeries(profile.points, keys,labels,0,1000,0, [resp.property], false);
            var occ = fac.extractSeries(profile.points, ['occupancy'],['Occupancy %'],80,100,1, [resp.property], false);
            var other = fac.extractSeries(profile.points, ['traffic','leases'],['Traffic/Wk','Leases/Wk'],0,10,0, [resp.property], false);

            resp.nerData = {height:300, printWidth:720, prefix:'$',suffix:'', title: 'Net Eff. Rent $', marker: true, data: ner.data, min: ner.min, max: ner.max};
            resp.occData = {height:250, printWidth:350, prefix:'',suffix:'%',title: 'Occupancy %', marker: false, data: occ.data, min: (resp.summary ? occ.min : 80), max: (resp.summary ? occ.max : 100)};
            resp.otherData = {height:250, printWidth:350, prefix:'',suffix:'', title: 'Traffic, Leases / Week', marker: true, data: other.data, min: other.min, max: other.max};

            if (pts && !graphs) {
                resp.nerKeys = keys;
                resp.otherTable = extractTableViews(resp.surveyData, resp.occData, pts, keys);
            }

            return resp;
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
                    switch (parseInt(b)) {
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

            resp.nerData = {height:300, printWidth:720, prefix:'$',suffix:'', title: 'Net Eff. Rent $', marker: true, data: ner.data, min: ner.min, max: ner.max};
            resp.occData = {height:300, printWidth:720, prefix:'',suffix:'%',title: 'Occupancy %', marker: false, data: occ.data, min: (summary ? occ.min : 80), max: (summary ? occ.max : 100)};

            return resp;
        }

        fac.reports = function(compids, subjectid, reports) {
            return $http.post('/api/1.0/properties/' + subjectid + '/reports', {
                compids: compids,
                reports: reports,
            }, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        return fac;
    }]);
});