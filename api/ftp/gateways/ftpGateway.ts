import * as express from "express";
import * as _ from "lodash";
import {parseDates, parseFloorplans, parseProperties, parseUnits} from "../services/ftpParsingService";
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

    const occupiedUnits = allUnits.filter((u) => {
        return !u.isExcluded && [
            "Notice Rented",
            "Notice Unrented",
            "Occupied No Notice",
        ].indexOf(u.status) > -1;
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
                    <B>Occupancy:</B>
                </td>
                <td>
                    ${(occupiedUnits.length / totalUnits.length * 100).toFixed(2)}%
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
        <A href="javascript:void()" onclick="$('#all').toggle()">Toggle All Yardi Units</A>`;

    html += renderYardiUnits(allUnits, "all", "none");
    html += `
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

            sorted = _.sortBy(countsArray, (u) => {
                return -1 * u.count;
            });

            common = sorted[0].rent.toFixed(0);
        }

        if (lowest > 0) {
            fp.rent = lowest;
        }

        html += `
             <tr>
                <td>
                    <A href="javascript:void()" onclick="$('#fp-${fp.yardiId}').toggle()">+</A>
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
                    ${renderYardiUnits(allfpUnits, "all-" + fp.yardiId, "block")}
                </td>
            </tr>
       `;
    });

    html += `</table>`;
    return res.status(200).send(html);
});

module.exports = routes;

function renderYardiUnits(units, divId, display) {
    let html = `<table border="1" cellpadding="2" cellspacing="0" style="border-color:#fff;display:${display}" id="${divId}">
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
