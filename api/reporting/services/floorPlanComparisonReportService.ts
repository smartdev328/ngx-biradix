import * as _ from "lodash";

export function summaryReport(floorplans: any, hideUnlinked: boolean, subject: any, comps: any[]): any {
    const report = {
        exclusions: {},
        exclusionsByBedrooms: {},
        exclusionBySubject: false,
        rankings: {},
        summary: [],
        totals: {} as any,
        excluded: false,
    };

    floorplans = _.sortByAll(floorplans, ["bedrooms", "bathrooms"]);

    let f;
    let p;
    let s;
    floorplans.forEach((fp) => {
        report.rankings[fp.bedrooms] = report.rankings[fp.bedrooms] || {};

        report.rankings[fp.bedrooms].floorplans = report.rankings[fp.bedrooms].floorplans || [];
        report.rankings[fp.bedrooms].excluded = report.rankings[fp.bedrooms].excluded || {};

        if ((hideUnlinked && fp.excluded) || (typeof fp.rent === "undefined" || fp.rent === null || isNaN(fp.rent))) {
            report.rankings[fp.bedrooms].excluded[fp.id] = true;
            report.exclusions[fp.id] = true;
        } else {
            f = {
                description: fp.description,
                units: fp.units,
                sqft: fp.sqft,
                ner: fp.ner,
                nersqft: fp.nersqft,
                runrate: fp.runrate,
                runratesqft: fp.runratesqft,
                rent: fp.rent,
                mersqft: fp.mersqft,
                concessionsMonthly: fp.concessionsMonthly,
                concessionsOneTime: fp.concessionsOneTime,
                concessions: fp.concessions,
            };

            if (subject._id.toString() === fp.id.toString()) {
                f.name = subject.name;
                f.address = subject.address;
                f.subject = true;
            } else {
                p = _.find(comps, (x) => {
                    return x._id.toString() === fp.id.toString();
                });

                f.name = p.name;
                f.address = p.address;
            }

            p = _.find(report.rankings[fp.bedrooms].floorplans, (x) => {
                return x.id.toString() === fp.id.toString(); 
            });

            if (!p) {
                p = {
                    id: fp.id.toString(),
                    name: f.name,
                    description: f.address,
                    subject: f.subject,
                    units: fp.units,
                    sqft: fp.sqft * fp.units,
                    ner: fp.ner * fp.units,
                    nersqft: fp.nersqft * fp.units,
                    runrate: fp.runrate * fp.units,
                    runratesqft: fp.runratesqft * fp.units,
                    rent: fp.rent * fp.units,
                    mersqft: fp.mersqft * fp.units,
                    concessions: fp.concessions * fp.units,
                };

                if (typeof fp.concessionsMonthly !== "undefined" && fp.concessionsMonthly !== null && !isNaN(fp.concessionsMonthly)) {
                    p.concessionsMonthly = fp.concessionsMonthly * fp.units;
                    p.concessionsOneTime = fp.concessionsOneTime * fp.units;
                    p.unitsDetailed = fp.units;
                } else {
                    p.unitsDetailed = 0;
                }

                report.rankings[fp.bedrooms].floorplans.push(p);
            } else {
                p.units += fp.units;
                p.sqft += (fp.sqft * fp.units);
                p.ner += (fp.ner * fp.units);
                p.nersqft += (fp.nersqft * fp.units);
                p.runrate += (fp.runrate * fp.units);
                p.runratesqft += (fp.runratesqft * fp.units);
                p.rent += (fp.rent * fp.units);
                p.mersqft += (fp.mersqft * fp.units);
                p.concessions += (fp.concessions * fp.units);

                if (typeof fp.concessionsMonthly !== "undefined" && fp.concessionsMonthly !== null && !isNaN(fp.concessionsMonthly)) {
                    p.concessionsMonthly = p.concessionsMonthly || 0;
                    p.concessionsOneTime = p.concessionsOneTime || 0;
                    p.concessionsMonthly += fp.concessionsMonthly * fp.units;
                    p.concessionsOneTime += fp.concessionsOneTime * fp.units;
                    p.unitsDetailed += fp.units;
                }
            }

            s = _.find(report.summary, (x) => {
                return x.id.toString() === fp.id.toString(); 
            });

            if (!s) {
                s = {
                    id: fp.id.toString(),
                    name: f.name,
                    description: f.address,
                    subject: f.subject,
                    units: fp.units,
                    sqft: fp.sqft * fp.units,
                    ner: fp.ner * fp.units,
                    nersqft: fp.nersqft * fp.units,
                    runrate: fp.runrate * fp.units,
                    runratesqft: fp.runratesqft * fp.units,
                    rent: fp.rent * fp.units,
                    mersqft: fp.mersqft * fp.units,
                    concessions: fp.concessions * fp.units,
                };

                if (typeof fp.concessionsMonthly !== "undefined" && fp.concessionsMonthly != null && !isNaN(fp.concessionsMonthly)) {
                    s.concessionsMonthly = fp.concessionsMonthly * fp.units;
                    s.concessionsOneTime = fp.concessionsOneTime * fp.units;
                    s.unitsDetailed = fp.units;
                } else {
                    s.unitsDetailed = 0;
                }

                report.summary.push(s);
            } else {
                s.units += fp.units;
                s.sqft += (fp.sqft * fp.units);
                s.ner += (fp.ner * fp.units);
                s.nersqft += (fp.nersqft * fp.units);
                s.runrate += (fp.runrate * fp.units);
                s.runratesqft += (fp.runratesqft * fp.units);
                s.rent += (fp.rent * fp.units);
                s.mersqft += (fp.mersqft * fp.units);
                s.concessions += (fp.concessions * fp.units);

                if (typeof fp.concessionsMonthly !== "undefined" && fp.concessionsMonthly != null && !isNaN(fp.concessionsMonthly)) {
                    s.concessionsMonthly = s.concessionsMonthly || 0;
                    s.concessionsOneTime = s.concessionsOneTime || 0;
                    s.concessionsMonthly += (fp.concessionsMonthly * fp.units);
                    s.concessionsOneTime += (fp.concessionsOneTime * fp.units);
                    s.unitsDetailed += fp.units;
                }
            }

            report.rankings[fp.bedrooms].summary = report.rankings[fp.bedrooms].summary || {};
            report.rankings[fp.bedrooms].summary.units = (report.rankings[fp.bedrooms].summary.units || 0) + fp.units;
            report.rankings[fp.bedrooms].summary.totalsqft = (report.rankings[fp.bedrooms].summary.totalsqft || 0) + fp.units * fp.sqft;
            report.rankings[fp.bedrooms].summary.totalner = (report.rankings[fp.bedrooms].summary.totalner || 0) + fp.units * fp.ner;
            report.rankings[fp.bedrooms].summary.totalnersqft = (report.rankings[fp.bedrooms].summary.totalnersqft || 0) + fp.units * fp.nersqft;
            report.rankings[fp.bedrooms].summary.totalrunrate = (report.rankings[fp.bedrooms].summary.totalrunrate || 0) + fp.units * fp.runrate;
            report.rankings[fp.bedrooms].summary.totalrunratesqft = (report.rankings[fp.bedrooms].summary.totalrunratesqft || 0) + fp.units * fp.runratesqft;
            report.rankings[fp.bedrooms].summary.totalrent = (report.rankings[fp.bedrooms].summary.totalrent || 0) + fp.units * fp.rent;
            report.rankings[fp.bedrooms].summary.totalmersqft = (report.rankings[fp.bedrooms].summary.totalmersqft || 0) + fp.units * fp.mersqft;
            report.rankings[fp.bedrooms].summary.totalconcessions = (report.rankings[fp.bedrooms].summary.totalconcessions || 0) + fp.units * fp.concessions;

            if (typeof fp.concessionsMonthly !== "undefined" && fp.concessionsMonthly != null && !isNaN(fp.concessionsMonthly)) {
                report.rankings[fp.bedrooms].summary.unitsDetailed = (report.rankings[fp.bedrooms].summary.unitsDetailed || 0) + fp.units;
                report.rankings[fp.bedrooms].summary.totalconcessionsMonthly = (report.rankings[fp.bedrooms].summary.totalconcessionsMonthly || 0) + fp.units * fp.concessionsMonthly;
                report.rankings[fp.bedrooms].summary.totalconcessionsOneTime = (report.rankings[fp.bedrooms].summary.totalconcessionsOneTime || 0) + fp.units * fp.concessionsOneTime;
            }

            report.totals.units = (report.totals.units || 0) + fp.units;
            report.totals.totalsqft = (report.totals.totalsqft || 0) + fp.units * fp.sqft;
            report.totals.totalner = (report.totals.totalner || 0) + fp.units * fp.ner;
            report.totals.totalnersqft = (report.totals.totalnersqft || 0) + fp.units * fp.nersqft;
            report.totals.totalrunrate = (report.totals.totalrunrate || 0) + fp.units * fp.runrate;
            report.totals.totalrunratesqft = (report.totals.totalrunratesqft || 0) + fp.units * fp.runratesqft;
            report.totals.totalrent = (report.totals.totalrent || 0) + fp.units * fp.rent;
            report.totals.totalmersqft = (report.totals.totalmersqft || 0) + fp.units * fp.mersqft;
            report.totals.totalconcessions = (report.totals.totalconcessions || 0) + fp.units * fp.concessions;

            if (typeof fp.concessionsMonthly !== "undefined" && fp.concessionsMonthly != null && !isNaN(fp.concessionsMonthly)) {
                report.totals.unitsDetailed = (report.totals.unitsDetailed || 0) + fp.units;
                report.totals.totalconcessionsMonthly = (report.totals.totalconcessionsMonthly || 0) + fp.units * fp.concessionsMonthly;
                report.totals.totalconcessionsOneTime = (report.totals.totalconcessionsOneTime || 0) + fp.units * fp.concessionsOneTime;
            }

        }
    });

    report.summary.forEach((f) => {
        f.sqft = Math.round(f.sqft / f.units);
        f.ner = f.ner / f.units;
        f.nersqft = f.ner / f.sqft;
        f.runrate = f.runrate / f.units;
        f.runratesqft = f.runrate / f.sqft;
        f.unitpercent = f.units / report.totals.units * 100;
        f.rent = f.rent / f.units;
        f.mersqft = f.rent / f.sqft;
        f.concessions = f.concessions / f.units;

        if (f.unitsDetailed && f.unitsDetailed > 0) {
            f.concessionsMonthly = f.concessionsMonthly / f.unitsDetailed;
            f.concessionsOneTime = f.concessionsOneTime / f.unitsDetailed;
        }
    });

    report.totals.sqft = report.totals.totalsqft / report.totals.units;
    report.totals.ner = report.totals.totalner / report.totals.units;
    report.totals.nersqft = report.totals.ner / report.totals.sqft;
    report.totals.runrate = report.totals.totalrunrate / report.totals.units;
    report.totals.runratesqft = report.totals.runrate / report.totals.sqft;
    report.totals.rent = report.totals.totalrent / report.totals.units;
    report.totals.mersqft = report.totals.rent / report.totals.sqft;
    report.totals.concessions = report.totals.totalconcessions / report.totals.units;

    if (report.totals.unitsDetailed && report.totals.unitsDetailed > 0) {
        report.totals.concessionsMonthly = report.totals.totalconcessionsMonthly / report.totals.unitsDetailed;
        report.totals.concessionsOneTime = report.totals.totalconcessionsOneTime / report.totals.unitsDetailed;
    }

    report.totals.unitsTotal = report.totals.units;
    report.totals.unitpercent = 100;
    report.totals.units = report.totals.units / report.summary.length;

    // Check if excluded property is missing so we can add it to the top level;
    for (const e in report.exclusions) {
        if (!_.find(report.summary,(x) => {
            return x.id.toString() === e;
        })) {
            report.exclusionBySubject = true;
        }
    }

    // Do the same thing for each group;
    for (const bedroom in report.rankings) {
        for (const e in report.rankings[bedroom].excluded) {
            if (!_.find(report.rankings[bedroom].floorplans, (x) => {
                return x.id.toString() === e;
            })) {
                report.exclusionsByBedrooms[bedroom] = true;
            }
        }
    }

    return report;
}
