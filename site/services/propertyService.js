angular.module('biradix.global').factory('$propertyService', ['$http','$cookies', function ($http,$cookies) {
        var fac = {};

        fac.checkDupe = function (criteria) {
            return $http.post('/api/1.0/properties/checkDupe?bust=' + (new Date()).getTime(), criteria,  {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.notifications_test = function (properties,showLeases,notification_columns) {
            return $http.post('/api/1.0/properties/notifications_test?bust=' + (new Date()).getTime(), {
                properties:properties,
                showLeases: showLeases,
                notification_columns: notification_columns
            },  {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.profile = function (id,daterange,show) {
            return $http.post('/api/1.0/properties/' + id + '/profile'+ '?bust=' + (new Date()).getTime(), {
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

        fac.getSubjects = function (propertyid) {
            return $http.get('/api/1.0/properties/' + propertyid+ '/subjects?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.getAmenityCounts = function () {
            return $http.get('/api/1.0/properties/getAmenityCounts?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.emailGuest = function (propertyid, guestid) {
            return $http.get('/api/1.0/properties/' + propertyid + '/survey/guests/' + guestid + '/email?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.getSurvey = function (id, surveyid) {
            return $http.get('/api/1.0/properties/' + id + '/survey/' + surveyid + '?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.getSurveyDates = function (id) {
            return $http.get('/api/1.0/properties/' + id + '/surveys?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.full = function (id,summary,bedrooms,daterange, show) {
            return $http.post('/api/1.0/properties/' + id + '/full'+ '?bust=' + (new Date()).getTime(), {
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
            return $http.post('/api/1.0/properties/' + id + '/dashboard'+ '?bust=' + (new Date()).getTime(), {
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
            return $http.post('/api/1.0/properties'+ '?bust=' + (new Date()).getTime(), criteria, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.create = function (property) {
            return $http.put('/api/1.0/properties'+ '?bust=' + (new Date()).getTime(), property, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.update = function (property) {
            return $http.put('/api/1.0/properties/' + property._id+ '?bust=' + (new Date()).getTime(), property, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.setActive = function (active, userId) {
            return $http.put('/api/1.0/properties/' + userId + '/active'+ '?bust=' + (new Date()).getTime(), { active: active}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.Approve = function (id) {
            return $http.get('/api/1.0/properties/' + id + '/approve'+ '?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.lookups = function () {
            return $http.get('/api/1.0/properties/lookups'+ '?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.unlinkComp = function (propertyid, compid) {
            return $http.delete('/api/1.0/properties/' + propertyid + '/comps/' + compid + '?bust=' + (new Date()).getTime(), {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.saveCompLink = function (propertyid, compid, floorplans, excluded) {
            return $http.post('/api/1.0/properties/' + propertyid + '/comps/' + compid+ '?bust=' + (new Date()).getTime(), {floorplans: floorplans, excluded : excluded}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.linkComp = function (propertyid, compid) {
            return $http.put('/api/1.0/properties/' + propertyid + '/comps/' + compid+ '?bust=' + (new Date()).getTime(), {}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.saveCompOrder = function (propertyid, compids) {
            return $http.post('/api/1.0/properties/' + propertyid + '/comps/saveOrder?bust=' + (new Date()).getTime(), {compids: compids}, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.createSurvey = function (propertyid, survey) {
            return $http.post('/api/1.0/properties/' + propertyid + '/survey'+ '?bust=' + (new Date()).getTime(), survey, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.getSurveyWarnings = function (propertyid, survey) {
            return $http.post('/api/1.0/properties/' + propertyid + '/survey/warnings'+ '?bust=' + (new Date()).getTime(), survey, {
                headers: {'Authorization': 'Bearer ' + $cookies.get('token') }}).success(function (response) {
                return response;
            }).error(function (response) {
                return response;
            });
        }

        fac.updateSurvey = function (propertyid, surveyid, survey) {
            return $http.put('/api/1.0/properties/' + propertyid + '/survey/' + surveyid+ '?bust=' + (new Date()).getTime() , survey, {
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

        fac.extractSeries = function(p, ks, ls, defaultMin, defaultMax, decinalPlaces, allComps, summary, selectedBedroom, bedrooms) {
            var series = [];
            var hasPoints = false;
            var comps = allComps;


            var lines = [];
            if (selectedBedroom == -2) {
                for (var b in bedrooms) {
                    lines.push({key: b.toString(), name: "(" + (b == 0 ? "Studios" : b + " Bdrs.") + ") " + comps[0].name, prop: comps[0]._id})
                    lines.push({key: b.toString(), name: "(" + (b == 0 ? "Studios" : b + " Bdrs.") + ") Comp Average" , prop: 'averages'})
                }

                if (Object.keys(bedrooms).length == 0) {
                    lines.push({key: -1, name: comps[0].name, prop: comps[0]._id})
                }


            }
            else
            //summary, show first prop then averages series
            if (summary) {
                lines.push({key: ks[0], name: comps[0].name, prop: comps[0]._id})
                lines.push({key: ks[0], name: "Comp Average", prop: 'averages'})
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
            var s;
            var data;
            var v;
            lines.forEach(function(c, lineIndex) {
                s = {data:[], name: c.name, _max: 0,  _min: 99999, _last : 0};
                data = [];
                if (p[c.prop] && p[c.prop][c.key]) {
                    data = p[c.prop][c.key];
                }

                if (data) {
                    data.forEach(function (point) {
                        v = point.v;

                        if (v != null) {
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
                        }
                    });

                    s.data = _.sortBy(s.data, function(o) { return o[0]; });
                }

                if (s.data.length > 0 || lineIndex == 0) {
                    series.push(s)
                }

            })


            var min, max;

            if (hasPoints) {

                if (!summary && !selectedBedroom == -2 && ls.length == 0 && series.length > 1) {
                    series = _.sortBy(series, function (x) {
                        return -x._last
                    })

                    // series.forEach(function (x, i) {
                    //     x.name = (i + 1) + ". " + x.name
                    // })
                }

                min = _.min(series, function (x) {
                    return x._min
                })._min;
                max = _.max(series, function (x) {
                    return x._max
                })._max;

                //Do not set min and max if there any points, let it auto resize
                // if (defaultMin == 80 && defaultMax == 100) {
                //
                // } else {
                //     min = null;
                //     max = null;
                //}
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

        var extractTableViews = function(surveys, occupancy, pts, nerColumns, showLeases, showRenewal, showATR) {
            var table = [];

            var tr, ls, surveyid, leased, renewal, n, row, atr;

            pts.occupancy.forEach(function(o) {
                tr = _.find(pts['traffic'], function(x) {return x.d == o.d})
                ls = _.find(pts['leases'], function(x) {return x.d == o.d})
                surveyid = _.find(surveys, function(x,y) {return y == o.d})

                if (showLeases) {
                    leased = _.find(pts['leased'], function(x) {return x.d == o.d})
                } else {
                    leased = null;
                }

                if (showRenewal) {
                    renewal = _.find(pts['renewal'], function(x) {return x.d == o.d})
                } else {
                    renewal = null;
                }

                if (showATR) {
                    atr = _.find(pts['atr'], function(x) {return x.d == o.d})
                } else {
                    atr = null;
                }

                if (!o.f) {

                    row = {d: o.d, occ: o.v, traffic: tr.v, leases: ls.v, surveyid: surveyid}

                    nerColumns.forEach(function (k) {
                        n = _.find(pts[k], function (x) {
                            return x.d == o.d
                        })

                        row[k] = n.v
                    })

                    if (leased) {
                        row.leased = leased.v;
                    }

                    if (renewal) {
                        row.renewal = renewal.v;
                    }

                    if (atr) {
                        row.atr = atr.v;
                    }

                    table.push(row);
                }
            } )

            table = _.sortBy(table, function(x) {return -x.d})

            return table;

        }
        fac.parseProfile = function(profile, graphs, showLeases, showRenewal, scale, showATR) {

            var resp = {};
            resp.lookups = profile.lookups;

            if (!profile.property) {
                return null;
            } else {
                resp.property = profile.property;
                resp.canManage = profile.canManage;
                resp.canSurvey = profile.canSurvey;
                resp.owner = profile.owner;
                resp.comp = profile.comps[0];
            }

            resp.property.hasName = resp.property.contactName && resp.property.contactName.length > 0;
            resp.property.hasEmail = resp.property.contactEmail && resp.property.contactEmail.length > 0;
            resp.property.hasWebsite = resp.property.website && resp.property.website.length > 0;
            resp.property.hasSurveyNotes = resp.property.survey && resp.property.survey.notes && resp.property.survey.notes.length > 0;
            resp.property.hasNotes = resp.property.notes && resp.property.notes.length > 0;
            resp.property.hasContact = resp.property.hasName || resp.property.hasEmail || resp.property.hasWebsite;
            resp.property.notes = (resp.property.notes || '').replace(/(?:\r\n|\r|\n)/g, '<br />');

            if (resp.property.hasSurveyNotes) {
                resp.property.survey.notes = (resp.property.survey.notes || '').replace(/(?:\r\n|\r|\n)/g, '<br />');
            }

            if (resp.property.website) {
                if (resp.property.website.length > 40) {
                    resp.property.websiteLabel = resp.property.website.replace("http://", '').substring(0, 40) + "...";
                } else {
                    resp.property.websiteLabel = resp.property.website.replace("http://", '')
                }
            }

            resp.property.hasFees = false;
            if (resp.property.fees) {
                for (var fee in resp.property.fees) {
                    if (resp.property.fees[fee].length > 0) {
                        resp.property.hasFees = true;
                    }
                }
            }

            var am;
            resp.property.location_am = [];
            resp.property.location_amenities.forEach(function (la) {
                am = _.find(resp.lookups.amenities, function (a) {
                    return a._id.toString() == la.toString()
                })
                if (am) {
                    resp.property.location_am.push(am.name)
                }
            })

            resp.property.community_am = [];
            resp.property.community_amenities.forEach(function (la) {
                am = _.find(resp.lookups.amenities, function (a) {
                    return a._id.toString() == la.toString()
                })
                if (am) {
                    resp.property.community_am.push(am.name)
                }
            })

            resp.property.floorplan_am = [];
            resp.property.floorplans.forEach(function (fp) {
                fp.amenities.forEach(function (la) {
                    am = _.find(resp.lookups.amenities, function (a) {
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


            var scaleDecimals = 0;
            var scaleText = "Net Eff. Rent";

            if (scale == "nersqft") {
                scaleDecimals = 2;
                scaleText = "Net Eff. Rent / Sqft";
            }

            var ner = fac.extractSeries(profile.points, keys,labels,0,1000,scaleDecimals, [resp.property], false);

            var occ ;
            var title = 'Occupancy';
            var points = ['occupancy'];
            var labels = ['Occupancy %'];

            if (showLeases) {
                title += " / Leased";
                points.push('leased');
                labels.push('Leased %');
            }

            if (showRenewal) {
                title += " / Renewal";
                points.push('renewal');
                labels.push('Renewal %');
            }

            if (showATR) {
                title += " / ATR %";
                points.push('atr');
                labels.push('ATR %');
            }

            occ = fac.extractSeries(profile.points, points,labels,80,100,1, [resp.property], false);

            if ((showRenewal || showLeases) && occ.min > 0) {
                occ.min = occ.min * .9;
            }

            resp.occData = {height:250, printWidth:380, decimalPlaces: 0, prefix:'',suffix:'%',title: '', marker: false, data: occ.data, min: (resp.summary ? occ.min : occ.min), max: (resp.summary ? occ.max : 100)};


            var other = fac.extractSeries(profile.points, ['traffic','leases'],['Traffic/Wk','Leases/Wk'],0,10,0, [resp.property], false);

            resp.nerData = {height:300, printWidth:800, decimalPlaces: scaleDecimals, prefix:'$',suffix:'', title: scaleText, marker: true, data: ner.data, min: ner.min, max: ner.max};

            resp.otherData = {height:250, printWidth:380, decimalPlaces: 0, prefix:'',suffix:'', title: '', marker: true, data: other.data, min: other.min, max: other.max};

            if (pts && !graphs) {
                resp.nerKeys = keys;
                resp.otherTable = extractTableViews(resp.surveyData, resp.occData, pts, keys, showLeases, showRenewal, showATR);
            }

            return resp;
        }



        fac.parseDashboard = function(dashboard, summary, showLeases, scale, selectedBedroom) {

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

            if (resp.property.website) {
                if (resp.property.website.length > 40) {
                    resp.property.websiteLabel = resp.property.website.replace("http://", '').substring(0, 40) + "...";
                } else {
                    resp.property.websiteLabel = resp.property.website.replace("http://", '')
                }
            }

            // resp.comps = _.sortBy(resp.comps, function (n) {
            //
            //     if (n._id.toString() == resp.property._id.toString()) {
            //         return "-1";
            //     }
            //     return n.name;
            // })

            resp.comps.forEach(function (c, i) {
                if (c._id.toString() != resp.property._id.toString()) {
                    resp.mapOptions.points.push({
                        loc: c.loc,
                        marker: 'number_' + i,
                        content: markerContent(c)
                    })
                }
            })

            resp.bedrooms = [{value: -1, text: 'Average'},{value: -2, text: 'All'}]

            if (resp.comps && resp.comps[0] && resp.comps[0].survey && resp.comps[0].survey.floorplans) {
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

            resp.bedroom = _.find(resp.bedrooms, function(x) {return x.value == selectedBedroom});

            if (!resp.bedroom) {
                resp.bedroom = resp.bedrooms[0];
            }



            var scaleDecimals = 0;
            var scaleText = "Net Eff. Rent (" + resp.bedroom.text + ")";

            if (scale == "nersqft") {
                scaleDecimals = 2;
                scaleText = "Net Eff. Rent / Sqft (" + resp.bedroom.text + ")";
            }

            resp.points = {excluded: dashboard.points.excluded};
            var ner = fac.extractSeries(dashboard.points, ['ner'],[],0,1000,scaleDecimals, resp.comps, summary, selectedBedroom, bedrooms);
            var occ = fac.extractSeries(dashboard.points, ['occupancy'],[],80,100,1, resp.comps, summary);
            var leased = fac.extractSeries(dashboard.points, ['leased'],[],80,100,1, resp.comps, summary);

            resp.nerData = {height:300, printWidth:800, decimalPlaces: scaleDecimals, prefix:'$',suffix:'', title: scaleText, marker: true, data: ner.data, min: ner.min, max: ner.max};

            var printWidth = 800;
            if (showLeases) {
                printWidth = 380;
            }
            resp.occData = {height:300, printWidth:printWidth, decimalPlaces: 0, prefix:'',suffix:'%',title: 'Occupancy', marker: false, data: occ.data, min: (summary ? occ.min : 80), max: (summary ? occ.max : 100)};
            resp.leasedData = {height:300, printWidth:printWidth, decimalPlaces: 0, prefix:'',suffix:'%',title: 'Leased', marker: false, data: leased.data, min: (summary ? leased.min : 80), max: (summary ? leased.max : 100)};

            return resp;
        }

        fac.getFullProperty = function(id) {
            return fac.search({limit: 1, permission: ['PropertyManage','CompManage'], _id: id
                , select: "_id name address city state zip phone owner management constructionType yearBuilt yearRenovated phone contactName contactEmail website notes fees orgid floorplans totalUnits community_amenities location_amenities"
            });
        }

        return fac;
    }]);
