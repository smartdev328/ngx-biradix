import * as express from "express";
import * as _ from "lodash";
import * as moment from "moment-timezone";
import {
    parseDates,
    parseFloorplans,
    parseProperties,
    parseProspectHistory, parseTenantHistory,
    parseUnits,
} from "../services/ftpParsingService";
import {connect} from "../services/ftpService";

const routes = express.Router();

routes.get("/dates", async (req, res) => {
    await connect();
    let dates: string[] = await parseDates("/pbbell");
    dates = dates.map((date) => {
        return `<li><a href='/ftp/date/${date}'>${date}</a></li>`;
    });

    const html = "<h1>/pbbell</h1>" + dates.join("\r\n");

    return res.status(200).send(html);
});

routes.get("/date/:date", async (req, res) => {
    let html = `<h1>/pbbell/${req.params.date}</h1>`;
    html += `<A href="/ftp/dates">&lt;- Back</A><Br><Br>`;
    await connect();
    let properties = await parseProperties("/pbbell", req.params.date);

    properties = properties.map((property) => {
        return `<li><A href="/ftp/date/${req.params.date}/${property.yardiId}">${property.name}</A> [<b>${property.yardiId}</b>]<Br><div style="margin-left:23px"><i>${property.address} - ${property.city} ${property.state}, ${property.zip}</i></div></li>`;
    });

    html += properties.join("\r\n");

    return res.status(200).send(html);
});

routes.get("/date/:date/:yardiId", async (req, res) => {

    let endDate = moment(`${req.params.date.substring(0, 4)}-${req.params.date.substring(4, 6)}-${req.params.date.substring(6, 8)}T23:59:59-08:00`).tz("America/Los_Angeles");
    endDate = endDate.startOf("isoWeek").add(-1, "minute");
    const startDate = endDate.clone().startOf("isoWeek");
    const startDateUtc = parseInt(startDate.format("x"), 10);
    const endDateUtc = parseInt(endDate.format("x"), 10);

    const startLeaseDate = endDate.clone().add(-30, "day").startOf("day");
    const startLeaseDateUtc = parseInt(startDate.format("x"), 10);

    const endLeaseDate = endDate.clone().add(60, "day").endOf("day");
    const endtLeaseDateUtc = parseInt(startDate.format("x"), 10);

    let html = `
<style>
    .plus {
    font-weight: bold;
    font-size: 20px;
    text-decoration: none;
    font-family: sans-serif;
    }
</style>
<script
  src="https://code.jquery.com/jquery-3.3.1.min.js"
  integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8="
  crossorigin="anonymous"></script>
<h1>/pbbell/${req.params.date}/${req.params.yardiId}</h1>`;
    html += `<A href="/ftp/date/${req.params.date}">&lt;- Back</A><Br><Br>`;
    await connect();
    const properties = await parseProperties("/pbbell", req.params.date);
    const property = properties.find((p) => {
        return p.yardiId === req.params.yardiId;
    });

    let floorplans = await parseFloorplans("/pbbell", req.params.date);
    floorplans = floorplans.filter((p) => {
        return p.propertyYardiId && p.propertyYardiId.toString() === req.params.yardiId.toString();
    });

    const units = await parseUnits("/pbbell", req.params.date);

    const allUnits = units.filter((un) => {
        return un.yardiPropertyId.toString() === req.params.yardiId.toString();
    });

    const totalUnits = allUnits.filter((un) => {
        return !un.isExcluded;
    });

    let tupple = filterWithCounts(allUnits, [
        "Notice Rented",
        "Notice Unrented",
        "Occupied No Notice",
    ]);
    const occupiedUnits = tupple[0];
    const occupancyCounts = tupple[1];

    tupple = filterWithCounts(allUnits, [
        "Notice Rented",
        "Notice Unrented",
        "Occupied No Notice",
        "Vacant Rented Not Ready",
        "Vacant Rented Ready",
    ]);
    const leasedUnits = tupple[0];
    const leasedCounts = tupple[1];

    tupple = filterWithCounts(allUnits, [
        "Vacant Rented Not Ready",
        "Vacant Rented Ready",
        "Vacant Unrented Not Ready",
        "Vacant Unrented Ready",
    ]);
    const totalVacantUnits = tupple[0];
    const totalVacantCounts = tupple[1];

    tupple = filterWithCounts(allUnits, [
        "Vacant Rented Not Ready",
        "Vacant Rented Ready",
    ]);
    const lessVacantUnits = tupple[0];
    const lessVacantCounts = tupple[1];

    tupple = filterWithCounts(allUnits, [
        "Notice Rented",
    ]);
    const lessNoticeUnits = tupple[0];
    const lessNoticeCounts = tupple[1];

    tupple = filterWithCounts(allUnits, [
        "Admin",
        "Down",
        "Excluded",
        "Model",
        "Waitlist",
    ]);
    const lessNonRevenueUnits = tupple[0];
    const lessNonRevenueCounts = tupple[1];

    tupple = filterWithCounts(allUnits, [
        "Notice Rented",
        "Notice Unrented",
    ]);
    const allNoticeUnits = tupple[0];
    const allNoticeCounts = tupple[1];

    property.atr = totalVacantUnits.length - lessVacantUnits.length - lessNoticeUnits.length - lessNonRevenueUnits.length + allNoticeUnits.length;

    const prospectHistory = await parseProspectHistory("/pbbell", req.params.date);
    const propertyProspects = prospectHistory.filter((p) => {
        p.utcDate = parseInt(p.date.format("x"), 10);
        p.valid = p.utcDate >= startDateUtc && p.utcDate <= endDateUtc;
        return p.yardiPropertyId.toString() === req.params.yardiId.toString() && p.eventType === "Walk-In";
    });

    const tenantHistory = await parseTenantHistory("/pbbell", req.params.date);

    const propertyTenants = tenantHistory.filter((un) => {
        return [
            "Submit Application",
            "Application Denied",
            "Cancel Move In",
            "Re-Apply",
        ].indexOf(un.event) > -1;
    });

    let u;
    propertyTenants.forEach((t) => {
        u = units.find((x) => {
           return x.yardiId === t.yardiUnitId;
        });
        t.yardiPropertyId = u.yardiPropertyId;
        t.yardiFloorplanId = u.yardiFloorplanId;
        t.isExcluded = u.isExcluded;
        t.utcDate = parseInt(t.date.format("x"), 10);
        t.leaseFromDateUtc = parseInt(t.leaseFromDate.format("x"), 10);
        t.valid = t.utcDate >= startDateUtc && t.utcDate <= endDateUtc;
    });

    const leases = propertyTenants.filter((un) => {
        return un.yardiPropertyId.toString() === req.params.yardiId.toString() && !un.isExcluded;
    });

    const applications = propertyTenants.filter((un) => {
        return un.yardiPropertyId.toString() === req.params.yardiId.toString() && !un.isExcluded &&
            ["Submit Application", "Lease Signed"].indexOf(un.event) > -1;
    });

    property.leases = 0;
    leases.forEach((x) => {
        if (["Submit Application", "Re-Apply"].indexOf(x.event) > -1) {
            x.sign = "+";
            if (x.valid) {
                property.leases++;
            }
        } else {
            x.sign = "-";
            if (x.valid) {
                property.leases--;
            }
        }
    });

    html += `
        <table border="1" cellpadding="2" cellspacing="0" style="border-color:#fff">
            <tr>
                <th colspan="100%">
                   Property Info 
                </th>
            </tr>
            <Tr>
                <td>
                    <B>Name:</B>
                </td>
                <td>
                    ${property.name}
                </td>
            </Tr>
            <Tr>
                <td valign="top">
                    <B>Address</B>
                </td>
                <td>
                    ${property.address}<Br>
                    ${property.city}, ${property.state} ${property.zip}
                </td>
            </Tr>  
            <Tr>
                <td>
                    <B>Total Units:</B>
                </td>
                <td>
                    ${totalUnits.length}
                </td>
            </Tr> 
            <Tr>
                <td>
                    <B>Traffic / Week:</B>
                </td>
                <td>
                    ${propertyProspects.filter((x) => x.valid === true).length}
                </td>
            </Tr> 
            <Tr>
                <td>
                    <B>Leases / Week:</B>
                </td>
                <td>
                    ${property.leases}
                </td>
            </Tr> 
            <Tr>
                <td>
                    <B>Occupancy %:</B>
                </td>
                <td>
                    ${(occupiedUnits.length / totalUnits.length * 100).toFixed(2)}%
                </td>
            </Tr> 
            <Tr>
                <td>
                    <B>Leased %:</B>
                </td>
                <td>
                    ${(leasedUnits.length / totalUnits.length * 100).toFixed(2)}%
                </td>
            </Tr> 
            <Tr>
                <td>
                    <B>ATR:</B>
                </td>
                <td>
                    ${property.atr}
                </td>
            </Tr> 
            <Tr>
                <td>
                    <B>ATR %:</B>
                </td>
                <td>
                    ${(property.atr / totalUnits.length * 100).toFixed(2)}%
                </td>
            </Tr> 
            <Tr>
                <td>
                    <B>Yardi Property Id:</B>
                </td>
                <td>
                    ${property.yardiId}
                </td>
            </Tr> 
            <Tr>
                <td>
                    <B>Yardi Property Code:</B>
                </td>
                <td>
                    ${property.yardiCode}
                </td>
            </Tr> 
        </table>

        <br>
        <A href="javascript:void()" onclick="$('#all').toggle()">Toggle More Info</A>
        <div id="all" style="display: none">
            <br>
            <B>Occupancy % Breakdown</B><Br>
            <table border="1" cellpadding="2" cellspacing="0" style="border-color:#fff">
            <tr>
                <th>
                   Status
                </th>
                <th>
                   Unit Count
                </th>
            </tr>`;
    Object.keys(occupancyCounts).forEach((s) => {
        html += `<tr><td>${s}</td><td>${occupancyCounts[s]}</td></tr>`;
    });

    html += `</table>
            <Br>
            <B>Leased % Breakdown</B><Br>
            <table border="1" cellpadding="2" cellspacing="0" style="border-color:#fff">
            <tr>
                <th>
                   Status
                </th>
                <th>
                   Unit Count
                </th>
            </tr>`;
    Object.keys(leasedCounts).forEach((s) => {
        html += `<tr><td>${s}</td><td>${leasedCounts[s]}</td></tr>`;
    });
    html += `</table>
            <Br>   
            <B>ATR Breakdown</B><Br>
            <table border="1" cellpadding="2" cellspacing="0" style="border-color:#fff">
            <tr>
                <th>
                   Status
                </th>
                <th>
                   Unit Count
                </th>
                <th>
                    Percent
                </th>
            </tr>
            <Tr>
                <td>
                    Total Vacant
                </td>
                <td>
                    +${totalVacantUnits.length}
                </td>
                <td>
                    ${(totalVacantUnits.length / totalUnits.length * 100).toFixed(2)}%
                </td>
            </Tr>
`;
    Object.keys(totalVacantCounts).forEach((s) => {
        html += `<tr><td style="padding-left:20px"><i>${s}</i></td><td style="padding-left:20px"><i>+${totalVacantCounts[s]}</i></td><td style="padding-left:20px"><i>${(totalVacantCounts[s] / totalUnits.length * 100).toFixed(2)}%</i></td></tr>`;
    });
    html += `
            <Tr>
                <td>
                    Less Vacant Rented
                </td>
                <td>
                    -${lessVacantUnits.length}
                </td>
                <td>
                    ${(lessVacantUnits.length / totalUnits.length * 100).toFixed(2)}%
                </td>
            </Tr>
    `;
    Object.keys(lessVacantCounts).forEach((s) => {
        html += `<tr><td style="padding-left:20px"><i>${s}</i></td><td style="padding-left:20px"><i>-${lessVacantCounts[s]}</i></td><td style="padding-left:20px"><i>${(lessVacantCounts[s] / totalUnits.length * 100).toFixed(2)}%</i></td></tr>`;
    });

    html += `
            <Tr>
                <td>
                    Less Notice Rented
                </td>
                <td>
                    -${lessNoticeUnits.length}
                </td>
                <td>
                    ${(lessNoticeUnits.length / totalUnits.length * 100).toFixed(2)}%
                </td>
            </Tr>
    `;
    Object.keys(lessNoticeCounts).forEach((s) => {
        html += `<tr><td style="padding-left:20px"><i>${s}</i></td><td style="padding-left:20px"><i>-${lessNoticeCounts[s]}</i></td><td style="padding-left:20px"><i>${(lessNoticeCounts[s] / totalUnits.length * 100).toFixed(2)}%</i></td></tr>`;
    });

    html += `
            <Tr>
                <td>
                    Less Non Revenue
                </td>
                <td>
                    -${lessNonRevenueUnits.length}
                </td>
                <td>
                    ${(lessNonRevenueUnits.length / totalUnits.length * 100).toFixed(2)}%
                </td>
            </Tr>
    `;
    Object.keys(lessNonRevenueCounts).forEach((s) => {
        html += `<tr><td style="padding-left:20px"><i>${s}</i></td><td style="padding-left:20px"><i>-${lessNonRevenueCounts[s]}</i></td><td style="padding-left:20px"><i>${(lessNonRevenueCounts[s] / totalUnits.length * 100).toFixed(2)}%</i></td></tr>`;
    });

    html += `
            <Tr>
                <td>
                    Plus All Notice
                </td>
                <td>
                    +${allNoticeUnits.length}
                </td>
                <td>
                    ${(allNoticeUnits.length / totalUnits.length * 100).toFixed(2)}%
                </td>
            </Tr>
    `;
    Object.keys(allNoticeCounts).forEach((s) => {
        html += `<tr><td style="padding-left:20px"><i>${s}</i></td><td style="padding-left:20px"><i>+${allNoticeCounts[s]}</i></td><td style="padding-left:20px"><i>${(allNoticeCounts[s] / totalUnits.length * 100).toFixed(2)}%</i></td></tr>`;
    });

    html += `
                </table>
                <br>
            <B>Traffic / Week</B> (${startDate.format() + " [" + startDateUtc}] - ${endDate.format() + " [" + endDateUtc}])<Br><Br>
            <table border="1" cellpadding="2" cellspacing="0" style="border-color:#fff">
            <tr>
                <th>
                   Prospect Id
                </th>
                <th>
                   Event
                </th>
                <th>
                   Date (str)
                </th>
                <th>
                   Date (pst)
                </th>
                <th>
                   Date (epoch)
                </th>
            </tr>`;
    propertyProspects.forEach((p) => {
        html += `<tr style="background-color: ${p.valid ? "lightgreen" : "inherit"}"><td>${p.prospectId}</td><td>${p.eventType}</td><td>${p.strDate}</td><td>${p.date.format()}</td><td>${p.utcDate}</td></tr>`;
    });
    html += `        
            </table>
                            <br>
            <B>Leases / Week</B> (${startDate.format() + " [" + startDateUtc}] - ${endDate.format() + " [" + endDateUtc}])<Br>
            <table border="1" cellpadding="2" cellspacing="0" style="border-color:#fff">
            <tr>
                <th>
                   Tenant Id
                </th>
                <th>
                   Yardi Unit Id
                </th>
                <th>
                   Yardi Floor Plan Id
                </th>
                <th>
                   Is Excluded
                </th>
                <th>
                   Sign
                </th>
                <th>
                   Event
                </th>
                <th>
                   Date (str)
                </th>
                <th>
                   Date (pst)
                </th>
                <th>
                   Date (epoch)
                </th>
            </tr>`;
    leases.forEach((p) => {
        html += `<tr style="background-color: ${p.valid ? "lightgreen" : "inherit"}"><td>${p.tenantId}</td><td>${p.yardiUnitId}</td><td>${p.yardiFloorplanId}</td><td>${p.isExcluded}</td><td>${p.sign}</td><td>${p.event}</td><td>${p.strDate}</td><td>${p.date.format()}</td><td>${p.utcDate}</td></tr>`;
    });
    html += `  
        </table>
        <Br>    
            <B>All Yardi Units</B><Br>
                    ${renderYardiUnits(allUnits)}
        </div>

        <br><Br>
  
        <table border="1" cellpadding="2" cellspacing="0" style="border-color:#fff">
            <tr>
                <th colspan="100%">
                   Floor Plans 
                </th>
            </tr>
            <tr>
                <th>
                
                </th>
                <th>
                   Type 
                </th>
                <th>
                   Description 
                </th>
                <th>
                   Units 
                </th>
                <th>
                   Units Avail.
                </th>
                <th>
                   Sqft 
                </th>
                <th>
                   Rent 
                </th>
                <th>
                   Yardi Floor Plan Id
                </th>
                <th>
                   Yardi Floor Plan Code
                </th>
            </tr>
    `;

    let fpUnits;
    let sorted;
    let allfpUnits;
    let lowest;
    let average;
    let common;
    let largest;
    let custom;
    let counts;
    let countsArray;
    let unitApplications;
    floorplans.forEach((fp) => {
        allfpUnits = units.filter((un) => {
            return un.yardiFloorplanId.toString() === fp.yardiId.toString();
        });

        unitApplications = applications.filter((un) => {
            return un.yardiFloorplanId.toString() === fp.yardiId.toString();
        });

        fpUnits = allfpUnits.filter((un) => {
            return !un.isExcluded;
        });

        lowest = 0;
        average = 0;
        common = 0;
        largest = 0;
        custom = 0;
        fp.units = fpUnits.length;
        fp.unitsAvailable = false;
        if (fpUnits && fpUnits.length > 0) {
            sorted = _.sortBy(fpUnits, (un) => {
                return un.rent;
            });
            lowest = sorted[0].rent.toFixed(0);

            sorted = _.sortBy(fpUnits, (un) => {
                return -1 * un.rent;
            });
            largest = sorted[0].rent.toFixed(0);

            fpUnits.forEach((f) => {
               average += f.rent;
            });

            average = (average / fpUnits.length).toFixed(0);

            counts = {};
            fpUnits.forEach((f) => {
                counts[f.rent] = (counts[f.rent] || 0) + 1;
            });

            countsArray = Object.keys(counts).map((f) => {
                return {rent: f, count: counts[f]};
            });

            countsArray = _.sortBy(countsArray, (un) => {
                return -1 * un.count;
            });

            common = parseInt(countsArray[0].rent, 10).toFixed(0);

            sorted = fpUnits.filter((un) => {
                return ["Notice Unrented",
                    "Vacant Unrented Not Ready",
                    "Vacant Unrented Ready"].indexOf(un.status) > -1;
            });

            if (sorted.length > 0) {
                sorted = _.sortBy(fpUnits, (un) => {
                    return un.rent;
                });
                custom = sorted[0].rent.toFixed(0);
                fp.unitsAvailable = true;
            } else {
                custom = average;
            }

        }

        if (custom > 0) {
            fp.rent = custom;
        }

        html += `
             <tr>
                <td>
                    <A href="javascript:void()" onclick="$('#fp-${fp.yardiId}').toggle()" class="plus">+</A>
                </td>
                <td>
                   ${fp.bedrooms}x${fp.bathrooms} 
                </td>
                <td>
                   ${fp.description} 
                </td>
                <td>
                   ${fp.units} 
                </td>
                <td>
                   ${fp.unitsAvailable ? "Yes" : "None"} 
                </td>
                <td>
                   ${fp.sqft} 
                </td>
                 <td>
                   $${fp.rent} 
                </td>
                <td>
                   ${fp.yardiId} 
                </td>
                <td>
                   ${fp.yardiCode} 
                </td>
            </tr>
            <tr id="fp-${fp.yardiId}" style="display: none">
                <td colspan="100%">
                    <Table>
                        <tr>
                            <Td>
                                <B>Lowest Rent:</B>
                             </Td>
                             <td>
                                $${lowest}
                              </td>
                        </tr>
                        <tr>
                            <Td>
                                <B>Highest Rent:</B>
                             </Td>
                             <td>
                                $${largest}
                              </td>
                        </tr>
                        <tr>
                            <Td>
                                <B>Average Rent:</B>
                             </Td>
                             <td>
                                $${average}
                              </td>
                        </tr>
                        <tr>
                            <Td>
                                <B>Most Common Rent:</B>
                             </Td>
                             <td>
                                $${common}
                              </td>
                        </tr>
                        <tr>
                            <Td>
                                <B>Custom Rent:</B>
                             </Td>
                             <td>
                                $${custom}
                              </td>
                        </tr>                        
                        <tr>
                            <Td>
                                <B>Current Strategy:</B>
                             </Td>
                             <td>
                                Custom
                              </td>
                        </tr>                                                
                    </Table>
                    <Br>
                    ${renderYardiUnits(allfpUnits)}
                    <Br>
                    <B>Lease Rent History</B> (${startLeaseDate.format()} to ${endLeaseDate.format()}):
                    <table border="1" cellpadding="2" cellspacing="0" style="border-color:#fff;">
                        <tr>
                            <th>
                               Event 
                            </th>                        
                            <th>
                               Rent 
                            </th>
                            <th>
                               Date (pst) 
                            </th>
                            <th>
                               Date (utc) 
                            </th>
                            <th>
                               LeaseFromDate (pst) 
                            </th>
                            <th>
                               LeaseFromDate (utc) 
                            </th>
                        </tr>  
 `;

        unitApplications.forEach((ap) => {
            html += `
                 <tr>
                    <td>
                       ${ap.event} 
                    </td>                 
                    <td>
                        $${ap.rent.toFixed(0)} 
                    </td>
                    <td>
                       ${ap.date.format()} 
                    </td>
                    <td>
                       ${ap.utcDate} 
                    </td>  
                    <td>
                       ${ap.leaseFromDate.format()} 
                    </td>
                    <td>
                       ${ap.leaseFromDateUtc} 
                    </td>                    
                </tr>
           `;
        });
        html += `
                    </table>
                    <Br>
                </td>
            </tr>
       `;
    });

    html += `</table>`;
    return res.status(200).send(html);
});

module.exports = routes;

function renderYardiUnits(units) {
    let html = `<table border="1" cellpadding="2" cellspacing="0" style="border-color:#fff;">
            <tr>
                <th>
                   Yardi Unit Id 
                </th>
                <th>
                   Yardi Floorplan Id 
                </th>
                <th>
                   Rent 
                </th>
                <th>
                   Sqft 
                </th>
                <th>
                   Status 
                </th>
                <th>
                   IsExclude
                </th>
            </tr>
    `;

    units.forEach((fp) => {
        html += `
             <tr>
                <td>
                   ${fp.yardiId} 
                </td>
                <td>
                   ${fp.yardiFloorplanId} 
                </td>
                 <td>
                   $${fp.rent.toFixed(0)} 
                </td>
                <td>
                   ${fp.sqft} 
                </td>

                <td>
                   ${fp.status} 
                </td>
                <td>
                   ${fp.isExcluded} 
                </td>
            </tr>
       `;
    });

    html += `</table>`;

    return html;
}

function filterWithCounts(allUnits, statuses: string[]): [any[], object] {
    const leasedUnits = allUnits.filter((u) => {
        return !u.isExcluded && statuses.indexOf(u.status) > -1;
    });

    const leasedCounts = {};
    leasedUnits.forEach((f) => {
        leasedCounts[f.status] = (leasedCounts[f.status] || 0) + 1;
    });

    return [leasedUnits, leasedCounts];
}
