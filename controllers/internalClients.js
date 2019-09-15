var ClientCtrl = {};

ClientCtrl.getClients = (req, res) => {
var filter = {
        id_client: req.query.id_client,
        name: req.query.name,
        pageStart: parseInt(req.query.skip || 0, 10),
        pageCount: parseInt(req.query.limit || 0, 10),
        orderBy: ''
    },
    dataQuery = 'SELECT IC.id, IC.legacy_id, IC.client_id, IC.name, IC.short_name, ' +
        'IC.address, IC.ruc, IC.status, U.code ubigeo_id, U.name ubigeo_desc ' +
        'FROM INTERNAL_CLIENTS IC LEFT JOIN UBIGEO U ' +
        'ON IC.ubigeo_id_id = U.id AND U.STATUS = 1 WHERE 1 ',
    countQuery = 'SELECT COUNT(ID) AS COUNTER FROM INTERNAL_CLIENTS IC WHERE 1 ',
    commonQuery = 'AND IC.STATUS = 1 ',
    dataParams = [],
    countParams = [];

// Set order expression
if (req.query.sort) {
    filter.orderBy = 'IC.' + req.query.sort + ' ' + req.query.sort_dir;
}

if (filter.id_client) {
    commonQuery += 'AND IC.ID_CLIENT = ? ';
    dataParams.push(filter.id_client);
    countParams.push(filter.id_client);
}

if (filter.name) {
    // For search key look into both name and short name
    commonQuery += 'AND (IC.NAME LIKE ? ';
    dataParams.push('%' + filter.name + '%');
    countParams.push('%' + filter.name + '%');

    commonQuery += 'OR IC.SHORT_NAME LIKE ?) ';
    dataParams.push('%' + filter.name + '%');
    countParams.push('%' + filter.name + '%');
}

// Add conditions
dataQuery += commonQuery;
countQuery += commonQuery;

// Add an ORDER BY sentence
dataQuery += ' ORDER BY ';
if (filter.orderBy) {
    dataQuery += filter.orderBy;
} else {
    dataQuery += 'IC.ID DESC';
}

// Set always an start for data
dataQuery += ' LIMIT ?';
dataParams.push(filter.pageStart);

if (filter.pageCount) {
    dataQuery += ', ?';
    dataParams.push(filter.pageCount);
} else {
    // Return 10 records at most if limit is not specified
    dataQuery += ', 10';
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

ClientCtrl.saveClients = (req, res) => {
var internalClientPB = req.body,
    internalClient = {};

internalClient.client_id = internalClientPB.client_id;
internalClient.name = internalClientPB.name;
internalClient.short_name = internalClientPB.short_name;
internalClient.address = internalClientPB.address;
internalClient.ruc = internalClientPB.ruc;
internalClient.ubigeo_id = internalClientPB.ubigeo_id || null;
internalClient.ubigeo_id_id = internalClientPB.ubigeo_id_id || null;

// Set default values
internalClient.status = 1;
internalClient.created_at = new Date();
internalClient.created_by = req.user && req.user.id || -1;

dbQuery('INSERT INTO INTERNAL_CLIENTS SET ?;', internalClient, function (err, result) {
    if (err) {
    printLog(err);
    res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
    return;
    }

    res.status(200).json({result: {code: '001', message: 'ok', id: result.insertId}});
});
};

ClientCtrl.getClient = (req, res) => {
  const internalClientId = req.params.id,
    dataQuery = 'SELECT IC.id, IC.legacy_id, IC.client_id, IC.name, IC.short_name, ' +
        'IC.address, IC.ruc, IC.status, IC.ubigeo_id_id, U.code ubigeo_id, U.name ubigeo_desc ' +
        'FROM INTERNAL_CLIENTS IC ' +
        'LEFT JOIN UBIGEO U ON IC.ubigeo_id_id = U.id AND U.STATUS = 1 ' +
        'WHERE ic.id = ?;';

  dbQuery(dataQuery, [internalClientId], function (err, result) {
    if (err) {
      printLog(err);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
      return;
    }

    if (result && result.length) {
      res.status(200).json(result[0]);
    } else {
      res.status(500).send({code: 500, msg: 'Client not found'});
    }
  });
};

ClientCtrl.updateClient = (req, res) => {
    var id = req.params.id,
        internalClientPB = req.body,
        internalClient = {};

    internalClient.legacy_id = internalClientPB.legacy_id || null;
    internalClient.client_id = internalClientPB.client_id;
    internalClient.name = internalClientPB.name;
    internalClient.short_name = internalClientPB.short_name;
    internalClient.address = internalClientPB.address;
    internalClient.ruc = internalClientPB.ruc;
    internalClient.ubigeo_id = internalClientPB.ubigeo_id || null;
    internalClient.ubigeo_id_id = internalClientPB.ubigeo_id_id || null;

    // Set default values
    internalClient.updated_at = new Date();
    internalClient.updated_by = req.user && req.user.id || -1;

    dbQuery('UPDATE INTERNAL_CLIENTS SET ? WHERE ID = ?;', [internalClient, id],
        function (err) {
        if (err) {
            printLog(err);
            res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
            return;
        }

        res.status(200).json({result: {code: '001', message: 'ok'}});
        });
};

ClientCtrl.deleteClient = (req, res) => {
  var id = req.params.id,
    internalClient = {
      // Set default values
      status: -1,
      updated_at: new Date(),
      updated_by: req.user && req.user.id || -1
    };

  dbQuery('UPDATE INTERNAL_CLIENTS SET ? WHERE ID = ?;', [internalClient, id],
    function (err) {
      if (err) {
        printLog(err);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
        return;
      }

      res.status(200).json({result: {code: '001', message: 'ok'}});
    });
};

module.exports = ClientCtrl;
