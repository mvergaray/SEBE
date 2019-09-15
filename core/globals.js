const _ = require('lodash');
const moment = require('moment');

var connection = require('./database.js');

global.printLog = function (msg) {
    'use strict';
    console.log(msg);
  };

  global.formatParams = function (params, delimS, delimE) {
    var result = [],
        joined;
    _.forEach(params, function (item) {
      var parsed = item;

      if (parsed instanceof Array) {
        parsed = formatParams(parsed, '(', ')');
      } else if (_.hasIn(parsed, 'getTime')) {
        parsed = moment(parsed).format('YYYY-MM-DD');
      } else if (_.hasIn(parsed, 'replace')) {
        parsed = parsed.replace(/'/g, "\\'");
      }
      result.push(parsed);
    });

    joined = "'" + result.join("','") + "'";
    joined = joined.replace(/'\(/g, '(').replace(/\)'/g, ')');


    return (delimS || "") + joined + (delimE || "");
  };

  // Set global function to handle db queries and have a log
  global.dbQuery = function () {
    var query = arguments[0],
        params = arguments[1],
        callback = arguments[2],
        skipParamsPrint = arguments[3],
        startAt = moment().format('DD/MM/YYY HH:mm:ss');

    connection.query(query, params, function (){
      printLog(startAt + ' DBQ \n');
      printLog(moment().format('DD/MM/YYY HH:mm:ss') + ' - DBQR');
      printLog(query);
      printLog('DBQP: ' + (skipParamsPrint ?
        'Parameters printing skipped' : formatParams(params)));

      callback.apply(this, arguments);
    });
    connection.on('error', function (err) {
      throw err;
      return;
    });
  };