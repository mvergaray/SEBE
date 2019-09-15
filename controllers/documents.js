var _ = require('lodash'),
    Record = require('../models/record'),
    Binnacle = require('../models/binnacle'),
    ResponseUtils = require('../core/ResponseUtils.js'),
    Utils = require('../core/utils.js');

var DocumentCtrl = {};

DocumentCtrl.saveDocuments = (req, res) => {
  var params = req.body,
      insertQuery = 'INSERT INTO RECORDS (document, dpto, province, district,' +
        'address, destination, sender, reference, date, status, user_id, created_at,' +
        'created_by, origin, sender_id, delivery_type_id, dt_user_id, dt_client_id, ' +
        'document_type_id, contact, weight, ubigeo_id, client_id) VALUES ?;',
      queryParams = [];

  params.user_id = req.user.id; // Logged User
  params.code = ''; //@TODO: GENERATE CODE

  // Get location texts
  // Only Cients and Others have Ubigeo
  let ubigeoCode = params.delivery_type_id == 3 ? params.dt_others_ubigeo :
        params.delivery_type_id == 2 ? params.deliveryClient.value.ubigeo_id: '',
      {dpto, prov, dist} = Utils.locationCodes(ubigeoCode || ''),
      locationQueries = `
        select * from ubigeo where code = '${dpto}';
        select * from ubigeo where code = '${prov}';
        select * from ubigeo where code = '${dist}';
        `;

  dbQuery(locationQueries, (error, results) => {
    if (error) {
      printLog(error);
      ResponseUtils.sendInternalServerError(res, error, results);
      return;
    }

    // Only Cients and Others have Ubigeo
    if (params.delivery_type_id > 1 && results && results[0] && results[0][0] && results[1] && results[1][0] &&
        results[2] && results[2][0]) {
      params.dpto = results[0][0].name;
      params.province = results[1][0].name;
      params.district = results[2][0].name;
    }

    if (_.isEmpty(params.multipleRecords)) {
      printLog('Create record, multipleRecords param is empty.');
      ResponseUtils.sendInternalServerError(res, 'No se recibió ningun detalle.', {});
      return;
    }

    _.forEach(params.multipleRecords, (details) => {
      var record = _.clone(params);

      record.document = details.document;
      record.reference = details.reference;
      queryParams.push((new Record(record, true)).data);
    });

    dbQuery(insertQuery, [queryParams], (err, result) => {
      var code,
          updateParams = [],
          updateQuery = 'UPDATE RECORDS SET CODE = CONCAT(LPAD(IDRECORD, 9, 0), LPAD(USER_ID, 4, 0)) ' +
            'WHERE IDRECORD >= ? AND IDRECORD < ?;';

      if (err) {
        printLog(err);
        ResponseUtils.sendInternalServerError(res, err, result);
        return;
      }

      updateParams.push(result.insertId, result.insertId + result.affectedRows);

      // Update record created to set code
      dbQuery(updateQuery, updateParams, (errU, resultU) => {
        if (errU) {
          printLog(errU);
          ResponseUtils.sendInternalServerError(res, errU, resultU);
          return;
        }

        res.status(200).json({result: {code: '001', message: 'ok', id: code}});
      });
    });
  });
};

DocumentCtrl.getDocuments = (req, res) => {
  var codes = req.query.codes,
      dataQuery = 'SELECT a.idrecord, a.code, a.document, a.dpto, a.province, ' +
        'a.district, a.address, a.destination, a.sender, a.reference, ' +
        'a.status, a.origin, a.sender_id, a.delivery_type_id, ' +
        'a.dt_user_id, a.dt_client_id, a.document_type_id, a.contact, a.weight, ' +
        'a.ubigeo_id, ' +
        'a.user_id, ' +
        'DATE_FORMAT(a.created_at, \'%d/%c/%Y - %H:%i:%S\') created_at, ' +
        'CONCAT(b.name, \' \', b.last_name) created_by_name, ' +
        'a.updated_by, ' +
        'DATE_FORMAT(a.updated_at, \'%d/%c/%Y - %H:%i:%S\') updated_at, ' +
        'CONCAT(c.name, \' \', c.last_name) updated_by_name ' +
        'FROM RECORDS a ' +
        'LEFT JOIN USERS b ON a.USER_ID = b.ID ' +
        'LEFT JOIN USERS c ON a.UPDATED_BY = c.ID ' +
        'WHERE a.CODE IN (?) ' +

        'AND a.STATUS <> 2;';

  dbQuery(dataQuery, [codes], (err, rows) => {
    if (err) {
      printLog(err);
      ResponseUtils.sendInternalServerError(res, err, rows);
      return;
    }

    rows = rows || [];

    // Add idx value
    rows = rows.map((row, idx) => {
      row.idx = idx + 1;
      return row;
    });

    // Re order rows based on search order
    rows = _.sortBy(rows, (o) => {
      return _.indexOf(codes, o.code);
    });

    /**
     * Result format: {results:{list:[], count:0}}
     */
    res.status(200).json({
      results: {
        list: rows,
        count: rows.length > 0 ? rows.length + 1 : 0
      }
    });
  });
};

DocumentCtrl.getDocumentsShort = (req, res) => {
  var codes = req.query.codes,
      dataQuery = 'SELECT a.idrecord, a.code, a.document, a.dpto, a.province, ' +
        'a.district, a.address, a.destination, a.sender, a.reference, ' +
        'a.status, a.origin, a.sender_id, a.delivery_type_id, ' +
        'a.dt_user_id, a.dt_client_id, a.document_type_id, a.contact, a.weight, ' +
        'a.ubigeo_id, a.user_id, ' +
        'DATE_FORMAT(a.created_at, \'%d/%c/%Y - %H:%i:%S\') created_at, ' +
        'a.updated_by, ' +
        'DATE_FORMAT(a.updated_at, \'%d/%c/%Y - %H:%i:%S\') updated_at ' +
        'FROM RECORDS a ' +
        'WHERE a.CODE IN (?) ' +
        'AND a.STATUS <> 2;';

  dbQuery(dataQuery, [codes], (err, rows) => {
    if (err) {
      printLog(err);
      ResponseUtils.sendInternalServerError(res, err, rows);
      return;
    }

    rows = rows || [];

    // Add idx value
    rows = rows.map((row, idx) => {
      row.idx = idx + 1;
      return row;
    });

    // Re order rows based on search order
    rows = _.sortBy(rows, (o) => {
      return _.indexOf(codes, o.code);
    });

    /**
     * Result format: {results:{list:[], count:0}}
     */
    res.status(200).json({
      results: {
        list: rows,
        count: rows.length > 0 ? rows.length + 1 : 0
      }
    });
  });
};

DocumentCtrl.getDocument = (req, res) => {
  var id = req.params.id,
      dataQuery = 'SELECT a.idrecord, a.code, a.document, a.dpto, a.province, ' +
        'a.district, a.address, a.destination, a.sender, a.reference, ' +
        'a.status, a.origin, a.sender_id, a.delivery_type_id, ' +
        'a.dt_user_id, a.dt_client_id, a.document_type_id, a.contact, a.weight, ' +
        'a.ubigeo_id, ' +
        'a.user_id, ' +
        'DATE_FORMAT(a.created_at, \'%d/%c/%Y - %H:%i:%S\') created_at, ' +
        'CONCAT(b.name, \' \', b.last_name) created_by_name, ' +
        'a.updated_by, ' +
        'DATE_FORMAT(a.updated_at, \'%d/%c/%Y - %H:%i:%S\') updated_at, ' +
        'CONCAT(c.name, \' \', c.last_name) updated_by_name ' +
        'FROM RECORDS a ' +
        'LEFT JOIN USERS b ON a.USER_ID = b.ID ' +
        'LEFT JOIN USERS c ON a.UPDATED_BY = c.ID ' +
        'WHERE a.IDRECORD = ?;';

  dbQuery(dataQuery, [id], (err, rows) => {
    if (err) {
      printLog(err);
      ResponseUtils.sendInternalServerError(res, err, rows);
      return;
    }

    res.status(200).json(_.first(rows) || {});
  });
};

DocumentCtrl.updateDocument = (req, res) => {
  var id = req.params.id,
      doc = req.body;

  doc.user_id = req.user.id; // Logged User
  // Set default values
  doc.updated_at = new Date();
  doc.updated_by = req.user && req.user.id || -1;

  // Get location texts
  // Only Cients and Others have Ubigeo
  let ubigeoCode = doc.delivery_type_id == 3 ? doc.dt_others_ubigeo :
        doc.delivery_type_id == 2 ? doc.deliveryClient.value.ubigeo_id :
          doc.deliveryUser.value.ubigeo_id,
      {dpto, prov, dist} = Utils.locationCodes(ubigeoCode || ''),
      locationQueries = `
        select * from ubigeo where code = '${dpto}';
        select * from ubigeo where code = '${prov}';
        select * from ubigeo where code = '${dist}';
        `;

  dbQuery(locationQueries, {}, (error, results) => {
    if (error) {
      printLog(error);
      ResponseUtils.sendInternalServerError(res, error, results);
      return;
    }

    if (results && results[0] && results[0][0] && results[1] && results[1][0] &&
        results[2] && results[2][0]) {
      // Only Cients and Others have Ubigeo
      doc.dpto = results[0][0].name;
      doc.province = results[1][0].name;
      doc.district = results[2][0].name;
    } else {
      doc.dpto = '';
      doc.province = '';
      doc.district = '';
    }


    dbQuery('UPDATE RECORDS SET ? WHERE IDRECORD = ?;', [new Record(doc), id],
      (err) => {
        if (err) {
          printLog(err);
          res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
          return;
        }

        res.status(200).json({result: {code: '001', message: 'ok'}});
      });
  });
};

DocumentCtrl.deleteDocument = (req, res) => {
  var id = req.params.id,
      doc = {
        // Set default values
        updated_at: new Date(),
        updated_by: req.user && req.user.id || -1,
        status: 2
      };

  dbQuery('UPDATE RECORDS SET ? WHERE IDRECORD = ?;', [doc, id], (err) => {
    if (err) {
      printLog(err);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
      return;
    }

    res.status(200).json({result: {code: '001', message: 'ok'}});
  });
};

DocumentCtrl.getBinnacle = (req, res) => {
  var id = req.params.id,
      binnaclesQuery = 'SELECT binnacle_id FROM BINNACLE_RECORDS WHERE RECORD_ID = ?;',
      assignmentEmployeeQuery = 'SELECT LPAD(a.id, 10, \'0\') manifest_code, a.action_id, a.id, ' +
        'a.assignment_type, a.assigned_id, ' +
        'a.f_description, a.s_description, ' +
        'DATE_FORMAT(a.created_at, \'%d/%c/%Y - %H:%i:%S\') created_at, ' +
        'CONCAT(c.first_name, \' \', c.last_name) created_by_name ' +
        'FROM BINNACLE a ' +
        'LEFT JOIN EMPLOYEES c ' +
        'ON a.ASSIGNED_ID = c.id ' +
        'WHERE A.ID IN (?) ' +
        'AND a.ASSIGNMENT_TYPE = 1 AND a.ACTION_ID = 1 ' +
        'ORDER BY manifest_code ASC;',
      assignmentOfficeQuery = 'SELECT LPAD(a.id, 10, \'0\') manifest_code, a.action_id, ' +
        'a.assignment_type, a.assigned_id, a.id, ' +
        'a.f_description, a.s_description, ' +
        'DATE_FORMAT(a.created_at, \'%d/%c/%Y - %H:%i:%S\') created_at, ' +
        'c.name created_by_name ' +
        'FROM BINNACLE a ' +
        'LEFT JOIN OFFICES c ' +
        'ON a.ASSIGNED_ID = c.ID ' +
        'WHERE A.ID IN (?) ' +
        'AND a.ASSIGNMENT_TYPE = 2 AND a.ACTION_ID = 1 ' +
        'ORDER BY manifest_code ASC;',
      assignmentInternQuery = 'SELECT LPAD(a.id, 10, \'0\') manifest_code, a.action_id, ' +
        'a.assignment_type, a.assigned_id, a.id, ' +
        'a.f_description, a.s_description, ' +
        'DATE_FORMAT(a.created_at, \'%d/%c/%Y - %H:%i:%S\') created_at, ' +
        'CONCAT(c.name, \' \', c.last_name) created_by_name ' +
        'FROM BINNACLE a ' +
        'LEFT JOIN USERS c ' +
        'ON a.CREATED_BY = c.ID ' +
        'WHERE A.ID IN (?) ' +
        'AND a.ASSIGNMENT_TYPE = 3 AND a.ACTION_ID = 1 ' +
        'ORDER BY manifest_code ASC;',
      dischargeQuery = 'SELECT LPAD(a.id, 10, \'0\') manifest_code, a.action_id, ' +
        'a.assignment_type, a.assigned_id, a.id, ' +
        'a.f_description, a.s_description, ' +
        'DATE_FORMAT(a.discharge_date, \'%d/%c/%Y - %H:%i:%S\') created_at, ' +
        '\'\' created_by_name ' +
        'FROM BINNACLE a ' +
        'WHERE A.ID IN (?) ' +
        'AND a.ASSIGNMENT_TYPE IS NULL AND a.ACTION_ID = 2 ' +
        'ORDER BY manifest_code ASC;',
      closeQuery = 'SELECT LPAD(a.id, 10, \'0\') manifest_code, a.action_id, a.assignment_type, ' +
        'a.assigned_id, a.id, ' +
        'a.f_description, a.s_description, ' +
        'DATE_FORMAT(a.created_at, \'%d/%c/%Y - %H:%i:%S\') created_at, ' +
        'CONCAT(c.name, \' \', c.last_name) created_by_name ' +
        'FROM BINNACLE a ' +
        'LEFT JOIN USERS c ' +
        'ON a.ASSIGNED_ID = c.ID ' +
        'WHERE A.ID IN (?) ' +
        'AND a.ASSIGNMENT_TYPE IS NULL AND a.ACTION_ID = 3 ' +
        'ORDER BY manifest_code ASC;',
      binnacle_ids = [],
      result = [];

    /*
      * Execute several queries as individual so mysql doesn't get stucked
      * on long time taking queries.
    */

  dbQuery(binnaclesQuery, [id],
    (err, rows) => {
      if (err) {
        printLog(err);
        ResponseUtils.sendInternalServerError(res, err, rows);
        return;
      }

      binnacle_ids = _.map(rows, 'binnacle_id') ;
      // Default -1 as id in case there is no binnacle_id that matched
      binnacle_ids = [binnacle_ids.length > 0 ? binnacle_ids : [-1]];

      dbQuery(assignmentEmployeeQuery, binnacle_ids,
        (errA, rowsA) => {
          if (errA) {
            printLog(errA);
            ResponseUtils.sendInternalServerError(res, errA, rowsA);
            return;
          }

          result = _.concat(result, rowsA);

          dbQuery(assignmentOfficeQuery, binnacle_ids,
            (errB, rowsB) => {
              if (errB) {
                printLog(errB);
                ResponseUtils.sendInternalServerError(res, errB, rowsB);
                return;
              }

              result = _.concat(result, rowsB);

              dbQuery(assignmentInternQuery, binnacle_ids,
                (errC, rowsC) => {
                  if (errC) {
                    printLog(errC);
                    ResponseUtils.sendInternalServerError(res, errC, rowsC);
                    return;
                  }

                  result = _.concat(result, rowsC);

                  dbQuery(dischargeQuery, binnacle_ids,
                    (errD, rowsD) => {
                      if (errD) {
                        printLog(errD);
                        ResponseUtils.sendInternalServerError(res, errD, rowsD);
                        return;
                      }

                      result = _.concat(result, rowsD);

                      dbQuery(closeQuery, binnacle_ids,
                        (errE, rowsE) => {
                          if (errE) {
                            printLog(errE);
                            ResponseUtils.sendInternalServerError(res, errE, rowsE);
                            return;
                          }

                          result = _.concat(result, rowsE);
                          result = _.orderBy(result, 'id');

                          res.status(200).json({
                            data: result
                          });
                        });
                    });
                });
            });
        });
    });
};

DocumentCtrl.assignDocument = (req, res) => {
  var params = req.body,
      query = 'INSERT INTO BINNACLE SET ?;',
      queryDetail = 'INSERT INTO BINNACLE_RECORDS (BINNACLE_ID, RECORD_ID, ACTION_ID, ' +
        'IS_LAST) VALUES ?;',
      // TODO: fix update issue only updating first row
      updateRecordsQuery = 'UPDATE RECORDS SET STATUS = 3 WHERE IDRECORD IN (?) AND STATUS <> 2;',
      updateBinnacleIsLast = 'UPDATE BINNACLE_RECORDS SET IS_LAST = 0 WHERE ACTION_ID = 1 AND RECORD_ID IN (?);',
      binnacle,
      data = [],
      binnacleId = 0;

  binnacle = {
    action_id: 1,
    assignment_type: params.assignment_type,
    assigned_id: params.assigned_id,
    f_description: params.service_order,
    s_description: params.shipping_type,
    created_at: new Date(),
    created_by: req.user.id
  };

  dbQuery(query, binnacle, (err, result) => {
    if (err) return ResponseUtils.sendInternalServerError(res, err, result);
    binnacleId = result.insertId;

    dbQuery(updateBinnacleIsLast, [params.records], (errA, resultA) => {
      if (errA) return ResponseUtils.sendInternalServerError(res, errA, resultA);

      _.forEach(params.records, (record) => {
        data.push([result.insertId, record, binnacle.action_id, 1]);
      });

      dbQuery(queryDetail, [data], (errI, resultI) => {
        if (errI) return ResponseUtils.sendInternalServerError(res, errI, resultI);

        dbQuery(updateRecordsQuery, [params.records], (errU, resultU) => {
          if (errU) return ResponseUtils.sendInternalServerError(res, errU, resultU);
          res.status(200).json({result: {code: '001', message: 'ok', id: binnacleId}});
        });
      });
    });
  });
};

DocumentCtrl.dischargeDocument = (req, res) => {
  var params = req.body,
      query = 'INSERT INTO BINNACLE SET ?;',
      queryDetail = 'INSERT INTO BINNACLE_RECORDS (BINNACLE_ID, RECORD_ID, ACTION_ID, ' +
        'IS_LAST) VALUES ?;',
      // TODO: fix update issue only updating first row
      updateRecordsQuery = 'UPDATE RECORDS SET STATUS = 4 WHERE IDRECORD IN (?) AND STATUS <> 2;',
      updateBinnacleIsLast = 'UPDATE BINNACLE_RECORDS SET IS_LAST = 0 WHERE ACTION_ID = 2 AND RECORD_ID IN (?);',
      binnacle,
      data = [],
      binnacleId = 0;

  params.action_id = 2;
  params.created_by = req.user.id;
  binnacle = new Binnacle(params);

  dbQuery(query, binnacle, (err, result) => {
    if (err) return ResponseUtils.sendInternalServerError(res, err, result);
    binnacleId = result.insertId;

    dbQuery(updateBinnacleIsLast, [params.records], (errA, resultA) => {
      if (errA) return ResponseUtils.sendInternalServerError(res, errA, resultA);

      _.forEach(params.records, (record) => {
        data.push([result.insertId, record, params.action_id, 1]);
      });

      dbQuery(queryDetail, [data], (errI, resultI) => {
        if (errI) return ResponseUtils.sendInternalServerError(res, errI, resultI);

        dbQuery(updateRecordsQuery, [params.records], (errU, resultU) => {
          if (errU) return ResponseUtils.sendInternalServerError(res, errU, resultU);
          res.status(200).json({result: {code: '001', message: 'ok', id: binnacleId}});
        });
      });
    });
  });
};

DocumentCtrl.closeDocument = (req, res) => {
  var params = req.body,
      query = 'INSERT INTO BINNACLE SET ?;',
      queryDetail = 'INSERT INTO BINNACLE_RECORDS (BINNACLE_ID, RECORD_ID, ACTION_ID, ' +
        'IS_LAST) VALUES ?;',
      // TODO: fix update issue only updating first row
      updateRecordsQuery = 'UPDATE RECORDS SET STATUS = 5 WHERE IDRECORD IN (?) AND STATUS <> 2;',
      updateBinnacleIsLast = 'UPDATE BINNACLE_RECORDS SET IS_LAST = 0 WHERE ACTION_ID = 3 AND RECORD_ID IN (?);',
      binnacle,
      data = [],
      binnacleId = 0;

  params.action_id = 3;
  params.created_by = req.user.id;
  binnacle = new Binnacle(params);

  dbQuery(query, binnacle, (err, result) => {
    if (err) return ResponseUtils.sendInternalServerError(res, err, result);
    binnacleId = result.insertId;

    dbQuery(updateBinnacleIsLast, [params.records], (errA, resultA) => {
      if (errA) return ResponseUtils.sendInternalServerError(res, errA, resultA);

      _.forEach(params.records, (record) => {
        data.push([result.insertId, record, params.action_id, 1]);
      });

      dbQuery(queryDetail, [data], (errI, resultI) => {
        if (errI) return ResponseUtils.sendInternalServerError(res, errI, resultI);

        dbQuery(updateRecordsQuery, [params.records], (errU, resultU) => {
          if (errU) return ResponseUtils.sendInternalServerError(res, errU, resultU);
          res.status(200).json({result: {code: '001', message: 'ok', id: binnacleId}});
        });
      });
    });
  });
};

module.exports = DocumentCtrl;
