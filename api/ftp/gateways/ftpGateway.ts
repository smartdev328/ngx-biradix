import * as express from "express";
import {parseDates, parseFloorplans, parseProperties} from "../services/ftpParsingService";
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
    let html = `<h1>/pbbell/${req.params.date}/${req.params.yardiId}</h1>`;
    html += `<A href="/ftp/date/${req.params.date}">&lt;- Back</A><Br><Br>`;
    await connect();
    const properties = await parseProperties("/pbbell", req.params.date);
    const property = properties.find((p) => {
        return p.yardiId === req.params.yardiId;
    })
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
    `;

    let floorplans = await parseFloorplans("/pbbell", req.params.date);
    floorplans = floorplans.filter((p) => {
        return p.propertyYardiId && p.propertyYardiId.toString() === req.params.yardiId.toString();
    })

    html += `
        <br>
        <table border="1" cellpadding="2" cellspacing="0" style="border-color:#fff">
            <tr>
                <th colspan="100%">
                   Floor Plans 
                </th>
            </tr>
            <tr>
                <th>
                   Type 
                </th>
                <th>
                   Description 
                </th>
                <th>
                   Sqft 
                </th>
                <th>
                   Yardi Floor Plan Id
                </th>
                <th>
                   Yardi Floor Plan Code
                </th>
            </tr>
    `;

    floorplans.forEach((fp) => {
       html += `
             <tr>
                <td>
                   ${fp.bedrooms}x${fp.bathrooms} 
                </td>
                <td>
                   ${fp.description} 
                </td>
                <td>
                   ${fp.sqft} 
                </td>
                <td>
                   ${fp.yardiId} 
                </td>
                <td>
                   ${fp.yardiCode} 
                </td>
            </tr>
       `;
    });

    html += `</table>`;
    return res.status(200).send(html);
});

module.exports = routes;
