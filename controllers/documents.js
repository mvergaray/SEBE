const configs = require('../core/config'),
  axios = require('axios')
  qs = require('qs');

let _ = require('lodash'),
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

DocumentCtrl.getRecords = (req, res) => {
  let params = {
      pageStart: parseInt(req.query.pageStart || req.query.skip || 0, 10),
      // Default Page Count to 50
      pageCount: parseInt(req.query.pageCount || req.query.limit || 50, 10),
      orderBy: req.query.orderBy,
      startDate: parseFloat(req.query.startDate || 0),
      endDate: parseFloat(req.query.endDate || 0),

      // Document data
      code: req.query.code,
      document: req.query.document,
      destination: req.query.destination,
      sender: req.query.sender,
      created_by: req.query.created_by,
      reference: req.query.reference,
      client_id: req.query.client_id,
      binnacle_id: req.query.binnacle_id,
      status: req.query.status
    },
    handleError = (err) => {
      printLog(err);
      ResponseUtils.sendInternalServerError(res, err);
    },
    query = 'SELECT idrecord ' +
      ', IFNULL(UPPER(a.document), \'\') document ' +
      ', IFNULL(DATE_FORMAT(a.date, \'%d/%c/%Y - %H:%i:%S\'), \'\') date ' +
      ', IFNULL(DATE_FORMAT(a.date, \'%d/%c/%Y\'), \'\') short_date ' +
      ', IFNULL(DATE_FORMAT(created_at, \'%d/%c/%Y - %H:%i:%S\'), \'\') created_at ' +
      ', IFNULL(UPPER(a.destination), \'\') destination ' +
      ', IFNULL(UPPER(a.address), \'\') address ' +
      ', IFNULL(UPPER(a.dpto), \'\') dpto ' +
      ', IFNULL(UPPER(a.province), \'\') province ' +
      ', IFNULL(UPPER(a.district), \'\') district ' +
      ', IFNULL(UPPER(a.sender), \'\') sender ' +
      ', IFNULL(a.sender_id, \'\') sender_id ' +
      ', IFNULL(UPPER(a.code), \'\') code ' +
      ', IFNULL(UPPER(a.reference), \'\') reference ' +
      ', IFNULL(a.creationCode, \'\') creationCode ' +
      ', IFNULL(a.weight, \'\') weight ' +
      ', IFNULL(UPPER(a.status), \'\') status ' +
      ', IFNULL(UPPER(a.origin), \'\') origin ' +
      ', IFNULL(UPPER(a.contact), \'\') contact ' +
      'FROM RECORDS a ' +

      'IGNORE INDEX (fk_user_id_idx, fk_client_id_idx, fk_sender_id_idx) ' +
      (params.binnacle_id ?
        'LEFT JOIN BINNACLE_RECORDS b ON a.idrecord = b.record_id ' :
        '') +
      'WHERE a.STATUS <> 2 ',
        dataParams = [];

  if (params.status) {
    query += ' AND a.STATUS = ?';
    dataParams.push(params.status);
  }

  if (params.binnacle_id) {
    query += ' AND b.binnacle_id = ?';
    dataParams.push(params.binnacle_id);
  }

  if (params.client_id) {
    query += ' AND a.client_id = ?';
    dataParams.push(params.client_id);
  }

  if (params.code) {
    query += ' AND a.CODE LIKE ? ';
    dataParams.push('%' + params.code + '%');
  }

  if (params.document) {
    query += ' AND a.DOCUMENT LIKE ? ';
    dataParams.push('%' + params.document + '%');
  }

  if (params.destination) {
    query += ' AND a.DESTINATION LIKE ? ';
    dataParams.push('%' + params.destination + '%');
  }

  if (params.sender) {
    query += ' AND a.SENDER LIKE ? ';
    dataParams.push('%' + params.sender + '%');
  }

  if (params.created_by) {
    query += ' AND a.CREATED_BY = ? ';
    dataParams.push(params.created_by);
  }

  if (params.reference) {
    query += ' AND a.REFERENCE LIKE ? ';
    dataParams.push('%' + params.reference + '%');
  }

  if (params.startDate) {
    query += ' AND DATE(a.DATE) >= ? ';
    dataParams.push(new Date(params.startDate));
  }

  if (params.endDate) {
    query += ' AND DATE(a.DATE) <= ? ';
    dataParams.push(new Date(params.endDate));
  }

  if (params.orderBy) {
    // Add an ORDER BY sentence
    // TODO: add irdrecord as second order param
    query += ' ORDER BY ';
    if (params.orderBy && params.orderBy.indexOf('date') === -1) {
      query += params.orderBy;
      query += ', a.DATE DESC';
    } else if (params.orderBy && params.orderBy.indexOf('date') > -1) {
      query += 'a.' + params.orderBy;
    } else {
      query += 'a.DATE DESC';
    }
  } else {
    query += ' ORDER BY a.DATE DESC, a.IDRECORD DESC ';
  }

  if (!isNaN(params.pageStart) && !isNaN(params.pageCount)) {
    // Set always an start for data
    query += ' LIMIT ? ';
    dataParams.push(params.pageStart);

    query += ', ?';
    dataParams.push(params.pageCount);
  }

  query += ';';

  dbQuery(query, dataParams, (err, rows) => {
    let result;

    if (err) return ResponseUtils.sendInternalServerError(res, err, result);

    result = {
      count: rows.length > 0 ? rows.length + params.pageStart + 1 : 0,
      list: rows
    };

    res.status(200).json(result);
  });
};

DocumentCtrl.getRecordsByParams = (params, skipPrinting) => {
  return new Promise( ( resolve, reject) => {
    var query = 'SELECT idrecord ' +
      ', IFNULL(UPPER(a.document), \'\') document ' +
      ', IFNULL(DATE_FORMAT(a.date, \'%d/%c/%Y - %H:%i:%S\'), \'\') date ' +
      ', IFNULL(DATE_FORMAT(a.date, \'%d/%c/%Y\'), \'\') short_date ' +
      ', IFNULL(DATE_FORMAT(created_at, \'%d/%c/%Y - %H:%i:%S\'), \'\') created_at ' +
      ', IFNULL(UPPER(a.destination), \'\') destination ' +
      ', IFNULL(UPPER(a.address), \'\') address ' +
      ', IFNULL(UPPER(a.dpto), \'\') dpto ' +
      ', IFNULL(UPPER(a.province), \'\') province ' +
      ', IFNULL(UPPER(a.district), \'\') district ' +
      ', IFNULL(UPPER(a.sender), \'\') sender ' +
      ', IFNULL(a.sender_id, \'\') sender_id ' +
      ', IFNULL(UPPER(a.code), \'\') code ' +
      ', IFNULL(UPPER(a.reference), \'\') reference ' +
      ', IFNULL(a.creationCode, \'\') creationCode ' +
      ', IFNULL(a.weight, \'\') weight ' +
      ', IFNULL(UPPER(a.status), \'\') status ' +
      ', IFNULL(UPPER(a.origin), \'\') origin ' +
      ', IFNULL(UPPER(a.contact), \'\') contact ' +
      'FROM RECORDS a ' +

      'IGNORE INDEX (fk_user_id_idx, fk_client_id_idx, fk_sender_id_idx) ' +
      (params.binnacle_id ?
        'LEFT JOIN BINNACLE_RECORDS b ON a.idrecord = b.record_id ' :
        '') +
      'WHERE a.STATUS <> 2 ',
        dataParams = [];

    if (params.status) {
      query += ' AND a.STATUS = ?';
      dataParams.push(params.status);
    }

    if (params.binnacle_id) {
      query += ' AND b.binnacle_id = ?';
      dataParams.push(params.binnacle_id);
    }

    if (params.client_id) {
      query += ' AND a.client_id = ?';
      dataParams.push(params.client_id);
    }

    if (params.code) {
      query += ' AND a.CODE LIKE ? ';
      dataParams.push('%' + params.code + '%');
    }

    if (params.document) {
      query += ' AND a.DOCUMENT LIKE ? ';
      dataParams.push('%' + params.document + '%');
    }

    if (params.destination) {
      query += ' AND a.DESTINATION LIKE ? ';
      dataParams.push('%' + params.destination + '%');
    }

    if (params.sender) {
      query += ' AND a.SENDER LIKE ? ';
      dataParams.push('%' + params.sender + '%');
    }

    if (params.created_by) {
      query += ' AND a.CREATED_BY = ? ';
      dataParams.push(params.created_by);
    }

    if (params.reference) {
      query += ' AND a.REFERENCE LIKE ? ';
      dataParams.push('%' + params.reference + '%');
    }

    if (params.startDate) {
      query += ' AND DATE(a.DATE) >= ? ';
      dataParams.push(new Date(params.startDate));
    }

    if (params.endDate) {
      query += ' AND DATE(a.DATE) <= ? ';
      dataParams.push(new Date(params.endDate));
    }

    if (params.orderBy) {
      // Add an ORDER BY sentence
      // TODO: add irdrecord as second order param
      query += ' ORDER BY ';
      if (params.orderBy && params.orderBy.indexOf('date') === -1) {
        query += params.orderBy;
        query += ', a.DATE DESC';
      } else if (params.orderBy && params.orderBy.indexOf('date') > -1) {
        query += 'a.' + params.orderBy;
      } else {
        query += 'a.DATE DESC';
      }
    } else {
      query += ' ORDER BY a.DATE DESC, a.IDRECORD DESC ';
    }

    if (!isNaN(params.pageStart) && !isNaN(params.pageCount)) {
      // Set always an start for data
      query += ' LIMIT ? ';
      dataParams.push(params.pageStart);

      query += ', ?';
      dataParams.push(params.pageCount);
    }

    query += ';';

    dbQuery(query, dataParams, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    }, skipPrinting);
  });
};

DocumentCtrl.getFileName = (req, res) => {
  const url = `${configs.FILE_SERVER}publicAccess/getFilesName`;

  axios.get(url, {
    params: req.query,
    paramsSerializer: params => {
      return qs.stringify(params)
    }
  })
  .then(response => {
    res.json(response.data);
  })
  .catch(error => {
    printLog(error);
    res.status(500).send({code: 500, msg: 'Internal Server Error', dev: error});
  });
};

module.exports = DocumentCtrl;
