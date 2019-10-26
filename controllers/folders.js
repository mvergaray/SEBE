let Controller = {};

Controller.getEntities = (req, res) => {
  var filter = {
        pageStart: parseInt(req.query.skip || 0, 10),
        pageCount: parseInt(req.query.limit || 0, 10),
        orderBy: ''
      },
      dataQuery = 'SELECT * FROM FOLDERS WHERE 1 ',
      commonQuery = ' ',
      dataParams = [];

  // Set order expression
  if (req.query.sort) {
    filter.orderBy = req.query.sort + ' ' + req.query.sort_dir;
  }

  // Add conditions
  dataQuery += commonQuery;

  // Add an ORDER BY sentence
  dataQuery += ' ORDER BY ID ASC';

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

  dbQuery(dataQuery, dataParams, function (err, rows) {
    if (err) {
      printLog(err);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
      return;
    }

    rows = rows || [{}];

    res.json({
      results: {
        list:rows
      }
    });
  });
};

Controller.saveObject;

module.exports = Controller;
