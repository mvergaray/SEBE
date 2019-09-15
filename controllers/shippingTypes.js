var extend = require('util')._extend;
var ShippingtypeCtrl = {};

/**
 * SHIPPINGType Object
 *
 * id
 * name
 * status
 * created_by
 * created_at
 * updated_by
 * updated_at
 */

ShippingtypeCtrl.getObjects = (req, res) => {
  var docType = {
        id: req.query.id,
        name: req.query.name
      },
      filter = {
        pageStart: parseInt(req.query.skip || 0, 10),
        pageCount: parseInt(req.query.limit || 0, 10),
        orderBy: ''
      },
      dataQuery = 'SELECT * FROM SHIPPING_TYPE WHERE 1 ',
      countQuery = 'SELECT COUNT(ID) AS COUNTER FROM SHIPPING_TYPE WHERE 1 ',
      commonQuery = 'AND STATUS = 1 ',
      dataParams = [],
      countParams = [];

  // Set order expression
  if (req.query.sort) {
    filter.orderBy = req.query.sort + ' ' + req.query.sort_dir;
  }

  if (docType.id) {
    commonQuery += 'AND ID = ? ';
    dataParams.push(docType.id);
  }

  if (docType.name) {
    commonQuery += 'AND NAME LIKE ? ';
    dataParams.push('%' + docType.name + '%');
  }

  // Counter doesn't need exta params so make a copy of data params at this point
  countParams = extend([], dataParams);
  // Add conditions
  dataQuery += commonQuery;
  countQuery += commonQuery;

  // Add an ORDER BY sentence
  dataQuery += ' ORDER BY ';
  if (filter.orderBy) {
    dataQuery += filter.orderBy;
  } else {
    dataQuery += 'ID DESC';
  }

  // Set always an start for data
  dataQuery += ' LIMIT ?';
  dataParams.push(filter.pageStart);

  if (filter.pageCount) {
    dataQuery += ', ?';
    dataParams.push(filter.pageCount);
  } else {
    // Request 500 records at most if limit is not specified
    dataQuery += ', 500';
  }

  dataQuery += ';';
  countQuery += ';';

  // Execute both queries at once
  dataParams = dataParams.concat(countParams);

  dbQuery(dataQuery + countQuery, dataParams, function (err, rows) {
    if (err) {
      printLog(err);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
      return;
    }

    rows = rows || [];

    /**
     * Result format: {results:{list:[], count:0}}
     */
    res.json({
      results: {
        list:rows[0],
        count: rows[1][0].COUNTER
      }
    });
  });
};

ShippingtypeCtrl.saveObjects = (req, res) => {
  var docTypeBP = req.body,
      docType = {};

  docType.name = docTypeBP.name;
  // Set default values
  docType.created_at = new Date();
  docType.status = 1;
  docType.created_by = req.user && req.user.id || -1;

  dbQuery('INSERT INTO SHIPPING_TYPE SET ?;', docType, function (err, result) {
    if (err) {
      printLog(err);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
      return;
    }

    res.json({result: {code: '001', message: 'ok', id: result.insertId}});
  });
};

ShippingtypeCtrl.getObject = (req, res) => {
  var id = req.params.id,
      dataQuery = 'SELECT * FROM SHIPPING_TYPE WHERE ID = ?;';

  dbQuery(dataQuery, [id], function (err, rows) {
    if (err) {
      printLog(err);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
      return;
    }

    rows = rows || [{}];

    res.json(rows[0]);
  });
};

ShippingtypeCtrl.updateObject = (req, res) => {
  var id = req.params.id,
      docTypeBP = req.body,
      docType = {};

  docType.name = docTypeBP.name;
  // Set default values
  docType.updated_at = new Date();
  docType.updated_by = req.user && req.user.id || -1;

  dbQuery('UPDATE SHIPPING_TYPE SET ? WHERE ID = ?;', [docType, id],
    function (err) {
      if (err) {
        printLog(err);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
        return;
      }

      res.json({result: {code: '001', message: 'ok'}});
    });
};

ShippingtypeCtrl.deleteObject = (req, res) => {
  var id = req.params.id,
      docType = {
        // Set default values
        updated_at: new Date(),
        status: -1,
        updated_by: req.user && req.user.id || -1
      };

  dbQuery('UPDATE SHIPPING_TYPE SET ? WHERE ID = ?;', [docType, id], function (err) {
    if (err) {
      printLog(err);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
      return;
    }

    res.json({result: {code: '001', message: 'ok'}});
  });
};

module.exports = ShippingtypeCtrl;
