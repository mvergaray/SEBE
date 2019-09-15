var extend = require('util')._extend;
var AreaCtrl = {};

AreaCtrl.getObjects = (req, res) => {
  var area = {
        id: req.query.id,
        office_id: req.query.office_id,
        name: req.query.name
      },
      filter = {
        pageStart: parseInt(req.query.skip || 0, 10),
        pageCount: parseInt(req.query.limit || 0, 10),
        orderBy: ''
      },
      dataQuery = 'SELECT A.*, O.NAME as \'office_name\' ' +
        'FROM AREAS A LEFT JOIN OFFICES O ON A.OFFICE_ID = O.ID WHERE 1 ',
      countQuery = 'SELECT COUNT(ID) AS COUNTER FROM AREAS A WHERE 1 ',
      commonQuery = 'AND A.STATUS = 1 ',
      dataParams = [],
      countParams = [];

  // Set order expression
  if (req.query.sort) {
    filter.orderBy = req.query.sort + ' ' + req.query.sort_dir;
  }

  if (area.id) {
    commonQuery += 'AND A.ID = ? ';
    dataParams.push(area.id);
  }

  if (area.office_id) {
    commonQuery += 'AND A.OFFICE_ID = ? ';
    dataParams.push(area.office_id);
  }

  if (area.name) {
    commonQuery += 'AND A.NAME like ? ';
    dataParams.push('%' + area.name + '%');
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
    dataQuery += 'A.ID DESC';
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

    rows = rows || [{}];

    /**
     * Result format: {results:{list:[], totalResults:0}}
     */
    res.json({
      results: {
        list:rows[0],
        count: rows[1][0].COUNTER
      }
    });
  });
};

AreaCtrl.saveObjects = (req, res) => {
  var areaPB = req.body,
      area = {};

  area.name = areaPB.name;
  area.office_id = areaPB.office_id;
  area.legacy_id = areaPB.legacy_id || null;

  // Set default values
  area.status = 1;
  area.created_at = new Date();
  area.created_by = req.user && req.user.id || -1;

  dbQuery('INSERT INTO AREAS SET ?;', area, function (err, result) {
    if (err) {
      printLog(err);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
      return;
    }

    res.json({result: {code: '001', message: 'ok', id: result.insertId}});
  });
};

AreaCtrl.getObject = (req, res) => {
  var areaId = req.params.id,
      dataQuery = 'SELECT A.*, O.client_id client_id, O.NAME as \'office_name\' ' +
        'FROM AREAS A ' +
        'LEFT JOIN OFFICES O ON A.OFFICE_ID = O.ID ' +
        'WHERE A.STATUS = 1 AND A.ID = ?;';

  dbQuery(dataQuery, [areaId], function (err, result) {
    if (err) {
      printLog(err);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
      return;
    }

    if (result && result.length) {
      res.status(200).json(result[0]);
    } else {
      res.status(500).send({code: 500, msg: 'Area not found'});
    }
  });
};

AreaCtrl.updateObject = (req, res) => {
  var areaId = req.params.id,
      areaPB = req.body,
      area = {};

  area.name = areaPB.name;
  area.office_id = areaPB.office_id;
  area.legacy_id = areaPB.legacy_id || null;

  // Set default values
  area.updated_at = new Date();
  area.updated_by = req.user && req.user.id || -1;

  dbQuery('UPDATE AREAS SET ? WHERE ID = ?;', [area, areaId],
    function (err) {
      if (err) {
        printLog(err);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
        return;
      }

      res.json({result: {code: '001', message: 'ok'}});
    });
};

AreaCtrl.deleteObject = (req, res) => {
  var id = req.params.id,
      area = {
        // Set default values
        status: -1,
        updated_at: new Date(),
        updated_by: req.user && req.user.id || -1
      };

  dbQuery('UPDATE AREAS SET ? WHERE ID = ?;', [area, id], function (err) {
    if (err) {
      printLog(err);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
      return;
    }

    res.json({result: {code: '001', message: 'ok'}});
  });
};

module.exports = AreaCtrl;
