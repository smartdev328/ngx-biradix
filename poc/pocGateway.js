'use strict';

var express = require('express');
var _ = require('lodash');
var routes = express.Router();


routes.get('/readXls', function (req, res) {


    var XLS = require('xlsjs');

    var path = __dirname + '/../site/poc/01. Beach House Market Survey 10-30-13.xls';
    console.log(path);

    var workbook = XLS.readFile(path);

    var sheet_name_list = workbook.SheetNames;
    console.log(sheet_name_list);
    var Address = workbook.Sheets[sheet_name_list[0]]['D9'].v;

    res.status(200).send('Address (Cell D9): ' + Address);
})



module.exports = routes;
