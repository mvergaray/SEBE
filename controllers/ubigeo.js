let controller = {};

controller.getUbigeo = (req, res) => {
  let dataQuery = 'select * from ubigeo where ',
        where = ' status = 1 ',
        dpto = +req.query.dpto,
        prov = +req.query.prov,
        dist = +req.query.dist,
        params = [];

    if (dist && dpto && prov) {
      where = where.concat('and coddpto = ? and codprov = ? and coddist = ?;');
      params.push(dpto);
      params.push(prov);
      params.push(dist);
    } else if (!dpto) {
      // Show all dpts
      where = where.concat('and coddpto <> 0 and codprov = 0 and coddist = 0;');
    } else if (!!dpto && !prov) {
      // show all provs
      where = where.concat('and coddpto = ? and codprov <> 0 and coddist = 0;');
      params.push(dpto);
    } else if (!!dpto && prov > 0) {
      // show all dists
      where = where.concat('and coddpto = ? and codprov = ? and coddist <> 0;');
      params.push(dpto);
      params.push(prov);
    }

    dbQuery(dataQuery + where, params, (err, rows) => {
      if (err) {
        printLog(err);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err, sql: dataQuery + where});
      }

      rows = rows || [];

      /**
       * Result format: {results:{list:[], totalResults:0}}
       */
      res
        .status(200)
        .json({
          results: {
            list:rows
          }
        });
    });
};

controller.saveUbigeo = (req, res) => {
  let zone = {
    name: req.body.name,
    ubigeo_id: req.body.code
  };

  dbQuery('select 1 from ZONES where ?', {name: zone.name}, (err, rows) => {
    if (err) {
      printLog(err);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
      return;
    }

    if (rows.length === 0) {
      dbQuery('Insert into ZONES SET ?', zone, (err) => {
        if (err) {
          printLog(err);
          res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
          return;
        }
        res
          .status(201)
          .json({
            results: {
              code:'ok'
            }
          });

      });
    } else {
      res
        .status(401)
        .json({
          results: {
            code:'error',
            message: 'El nombre de zona ya exite'
          }
        });
    }

  });
};

module.exports = controller;
