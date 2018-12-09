import * as express from "express";
import * as _ from "lodash";
import {
    parseDates,
    parseFloorplans,
    parseProperties,
    parseProspectHistory, parseTenantHistory,
    parseUnits
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

    const allUnits = units.filter((u) => {
        return u.yardiPropertyId.toString() === req.params.yardiId.toString();
    });

    const totalUnits = allUnits.filter((u) => {
        return !u.isExcluded;
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
    const propertyProspects = prospectHistory.filter((u) => {
        return u.yardiPropertyId.toString() === req.params.yardiId.toString() && u.eventType === "Walk-In";
    });

    const tenantHistory = await parseTenantHistory("/pbbell", req.params.date);

    const propertyTenants = tenantHistory.filter((u) => {
        return [
            "Submit Application",
            "Application Denied",
            "Cancel Move In",
            "Re-Apply",
        ].indexOf(u.event) > -1;
    });

    let u;
    propertyTenants.forEach((t) => {
        u = units.find((x) => {
           return x.yardiId === t.yardiUnitId;
        });
        t.yardiPropertyId = u.yardiPropertyId;
        t.yardiFloorplanId = u.yardiFloorplanId;
        t.isExcluded = u.isExcluded;
    });

    const leases = propertyTenants.filter((u) => {
        return u.yardiPropertyId.toString() === req.params.yardiId.toString() && !u.isExcluded;
    });

    property.leases = 0;
    leases.forEach((x) => {
        if (["Submit Application", "Re-Apply"].indexOf(x.event) > -1) {
            x.sign = "+";
            property.leases++;
        } else {
            x.sign = "-";
            property.leases--;
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
                    ${propertyProspects.length}
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
            <B>Traffic / Week</B><Br>
            <table border="1" cellpadding="2" cellspacing="0" style="border-color:#fff">
            <tr>
                <th>
                   Prospect Id
                </th>
                <th>
                   Event
                </th>
                <th>
                   Date
                </th>
            </tr>`;
    propertyProspects.forEach((p) => {
        html += `<tr><td>${p.prospectId}</td><td>${p.eventType}</td><td>${p.date}</td></tr>`;
    });
    html += `        
            </table>
                            <br>
            <B>Leases / Week</B><Br>
            <table border="1" cellpadding="2" cellspacing="0" style="border-color:#fff">
            <tr>
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
                   Date
                </th>
            </tr>`;
    leases.forEach((p) => {
        html += `<tr><td>${p.yardiUnitId}</td><td>${p.yardiFloorplanId}</td><td>${p.isExcluded}</td><td>${p.sign}</td><td>${p.event}</td><td>${p.date}</td></tr>`;
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
    let counts;
    let countsArray;
    floorplans.forEach((fp) => {
        allfpUnits = units.filter((u) => {
            return u.yardiFloorplanId.toString() === fp.yardiId.toString();
        });

        fpUnits = allfpUnits.filter((u) => {
            return !u.isExcluded;
        });

        lowest = 0;
        average = 0;
        common = 0;
        largest = 0;
        fp.units = fpUnits.length;
        if (fpUnits && fpUnits.length > 0) {
            sorted = _.sortBy(fpUnits, (u) => {
                return u.rent;
            });
            lowest = sorted[0].rent.toFixed(0);

            sorted = _.sortBy(fpUnits, (u) => {
                return -1 * u.rent;
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

            countsArray = _.sortBy(countsArray, (u) => {
                return -1 * u.count;
            });

            common = parseInt(countsArray[0].rent, 10).toFixed(0);
        }

        if (lowest > 0) {
            fp.rent = lowest;
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
                                <B>Current Strategy:</B>
                             </Td>
                             <td>
                                Lowest
                              </td>
                        </tr>                                                
                    </Table>
                    <Br>
                    ${renderYardiUnits(allfpUnits)}
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
