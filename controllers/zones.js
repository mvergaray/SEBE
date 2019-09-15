let extend = require('util')._extend;
let controller = {};

controller.saveDepartment = (req, res) => {
  let name = req.body.name,
        newId = 0,
        zone = {};

    dbQuery('select 1 from UBIGEO where name = ? and codprov = 0 and coddist = 0 and status = 1', [name],
      (err, rows) => {
        if (err) {
          printLog(err);
          res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
          return;
        }

        if (rows.length === 0) {
          // Generate new code ubigeo
          dbQuery('SELECT max(coddpto) dpto from UBIGEO', (err, rows) => {
            if (err) {
              printLog(err);
              res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
              return;
            }
            newId = 1 + rows[0].dpto;

            zone.coddpto = newId;
            zone.codprov = 0;
            zone.coddist = 0;
            zone.name = name;
            zone.code = newId < 10 ? '0' + newId + '0000' : newId + '0000';
            zone.status = 1;

            dbQuery('insert into UBIGEO SET ? ', zone, (err) => {
              if (err) {
                printLog(err);
                res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
                return;
              }
              res.json({results: {code: '001', message: 'ok'}});
            });
          });
        } else {
          res
            .status(401)
            .json({results: {code:'error', message: 'El nombre de departamento ya exite' }});
        }
      });
};
controller.getDepartment = (req, res) => {
  const id = req.params.id;

  dbQuery('select * from UBIGEO where coddpto = ?  and status = 1', [id], (error, rows) => {
    if (error) {
      printLog(error);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: error});
      return;
    }
    res
      .status(200)
      .json(rows[0]);
  });
};
controller.deleteDepartment = (req, res) => {
  const coddpto = req.params.id.substring(0, 2);

  dbQuery('update UBIGEO set status = "0" where coddpto = ?', [coddpto], (err) => {
    if (err) {
      printLog(err);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
      return;
    }
    res.json({results: {code: '001', message: 'ok'}});
  });
};
/*controller.updateDepartment = (req, res) => {
  let name = req.body.name,
        id = req.params.id,
        zone = {};

  dbQuery('select 1 from UBIGEO where name = ? and codprov = 0 and coddist = 0 and status = 1 and coddpto <> ?',
    [name, id], (err, rows) => {
      if (err) {
        printLog(err);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
        return;
      }

      if (rows.length === 0) {
        zone.name = name;

        dbQuery('update UBIGEO SET ?  where coddpto = ? and codprov = 0 and coddist = 0', [zone, id],
          (err) => {
            if (err) {
              printLog(err);
              res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
              return;
            }
            res.json({results: {code: '001', message: 'ok'}});
          });
      } else {
        res
          .status(401)
          .json({results: {code:'error', message: 'El nombre de departamento ya exite' }
          });
      }
    });
};
*/
controller.updateDepartment = (req, res) => {
  let name = req.body.name,
    code = req.params.id,
    coddpto = code.substring(0, 2),
    zone = {};

  dbQuery('select 1 from UBIGEO where name = ? and coddpto <> ? and codprov = 0 and coddist = 0 and status = 1',
    [name, coddpto], (err, rows) => {
      if (err) {
        printLog(err);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
        return;
      }

      if (rows.length === 0) {
        zone.name = name;

        dbQuery('update UBIGEO SET ? where code = ?;', [zone, code],
          (err) => {
            if (err) {
              printLog(err);
              res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
              return;
            }
            res.json({results: {code: '001', message: 'ok'}});
          });
      } else {
        res
          .status(401)
          .json({results: {code:'error', message: 'El nombre de departamento ya exite' }});
      }
    });
};

controller.saveProvince = (req, res) => {
  let name = req.body.name,
        dpto = req.body.dpto,
        newId = 0,
        zone = {};

  dbQuery('select 1 from UBIGEO where ' +
    // Check only provinces belonging to the same department
    'coddpto = ? and ' +
    // Check level of zone (this means the zone is a province)
    'codprov <> 0 and coddist = 0 and ' +
    // Check name and that is a valid zone
    'name = ? and status = 1;', [dpto, name], (err, rows) => {
      if (err) {
        printLog(err);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
        return;
      }

      if (rows.length === 0) {
        // Generate new code ubigeo
        dbQuery('SELECT IFNULL(max(codprov),0) id from UBIGEO  where coddpto = ?', [dpto], (err, rows) => {
          var cDpto,
              cProv,
              cDist;

          if (err) {
            printLog(err);
            res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
            return;
          }
          newId = 1 + rows[0].id;

          // Generate code
          cDpto = dpto < 10 ? '0' + dpto: dpto;
          cProv = newId < 10 ? '0' + newId: newId;
          cDist = '00';

          zone.coddpto = dpto;
          zone.codprov = newId;
          zone.coddist = 0;
          zone.name = name;
          zone.code = cDpto + cProv + cDist;
          zone.status = 1;

          dbQuery('insert into UBIGEO SET ? ', zone, (err) => {
            if (err) {
              printLog(err);
              res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
            }

            res.json({results: {code: '001', message: 'ok'}});
          });
        });
      } else {
        res
          .status(401)
          .json({results: {code:'error', message: 'El nombre de provincia ya exite' }
          });
      }
    });
};
controller.getProvince = (req, res) => {
  const id = req.params.id,
        dpto = req.query.dpto;

  dbQuery('select * from UBIGEO where coddpto = ? and codprov = ?  and status = 1', [dpto, id],
    (error, rows) => {
      if (error) {
        printLog(error);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: error});
        return;
      }
      res
        .status(200)
        .json(rows[0]);
    });
};
controller.deleteProvince = (req, res) => {
  const codprov = req.params.id.substring(2, 4);

  dbQuery('update UBIGEO set status = "0" where codprov = ?;', [codprov],
    (err) => {
      if (err) {
        printLog(err);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
        return;
      }
      res.json({results: {code: '001', message: 'ok'}});
    });
};
/*controller.updateProvince = (req, res) => {
  let name = req.body.name,
    dpto = req.body.dpto,
    id = req.params.id,
    zone = {};

  dbQuery('select 1 from UBIGEO where ' +
    // Check only provinces belonging to the same department
    'coddpto = ? and ' +
    // Check level of zone (this means the zone is a province)
    'codprov <> 0 and coddist = 0 and ' +
    // Check for other provinces but the one you're updating
    'codprov <> ? and ' +
    // Check name and that is a valid zone
    'name = ? and status = 1;', [dpto, id, name], (err, rows) => {
      if (err) {
        printLog(err);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
        return;
      }

      if (rows.length === 0) {
        zone.name = name;

        dbQuery('update UBIGEO SET ? where coddpto = ? and codprov = ? and coddist = 0', [zone, dpto, id],
          (err) => {
            if (err) {
              printLog(err);
              res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
              return;
            }
            res.json({results: {code: '001', message: 'ok'}});
          });
      } else {
        res
          .status(401)
          .json({results: {code: 401, message: 'El nombre de provincia ya exite' }});
      }
    });
};*/
controller.updateProvince = (req, res) => {
  let name = req.body.name,
    code = req.params.id,
    coddpto = code.substring(0, 2),
    codprov = code.substring(2, 4),
    zone = {};

  dbQuery('select 1 from UBIGEO where name = ? and codprov <> ? and coddpto = ? and coddist = 0 and status = 1',
    [name, codprov, coddpto], (err, rows) => {
      if (err) {
        printLog(err);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
        return;
      }

      if (rows.length === 0) {
        zone.name = name;

        dbQuery('update UBIGEO SET ? where code = ?', [zone, code],
          (err) => {
            if (err) {
              printLog(err);
              res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
              return;
            }
            res.json({results: {code: '001', message: 'ok'}});
          });
      } else {
        res
          .status(401)
          .json({results: {code:'error', message: 'El nombre de provincia ya exite' }});
      }
    });
};

controller.saveDistrict = (req, res) => {
  let name = req.body.name,
    dpto = req.body.dpto,
    prov = req.body.prov,
    newId = 0,
    zone = {};

  dbQuery('select 1 from UBIGEO where ' +
    // Check only districts belonging to the same department and province
    'coddpto = ? and codprov = ? and ' +
    // Check level of zone (this means the zone is a district)
    'codprov <> 0 and coddist <> 0 and ' +
    // Check name and that is a valid zone
    'name = ? and status = 1;', [dpto, prov, name], (err, rows) => {
      if (err) {
        printLog(err);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
        return;
      }

      if (rows.length === 0) {
        // Generate new code ubigeo
        dbQuery('SELECT IFNULL(max(coddist),0) id from UBIGEO  where coddpto = ? and codprov = ?', [dpto, prov],
          (err, rows) => {
            var cDpto,
                cProv,
                cDist;

            if (err) {
              printLog(err);
              res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
              return;
            }
            newId = 1 + rows[0].id;

            // Generate code
            cDpto = dpto < 10 ? '0' + dpto : dpto;
            cProv = prov < 10 ? '0' + prov : prov;
            cDist = newId < 10 ? '0' + newId : newId;


            zone.coddpto = dpto;
            zone.codprov = prov;
            zone.coddist = newId;
            zone.name = name;
            zone.code = cDpto + cProv + cDist;
            zone.status = 1;

            dbQuery('insert into UBIGEO SET ? ', zone, (err) => {
              if (err) {
                printLog(err);
                res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
                return;
              }

              res.json({results: {code: '001', message: 'ok'}});
            });
          });
      } else {
        res
          .status(401)
          .json({results: {code: 401, message: 'El nombre de distrito ya exite'}});
      }
    });
};
controller.getDistrict = (req, res) => {
  const id = req.params.id,
        dpto = req.query.dpto,
        prov = req.query.prov;

  dbQuery('select * from UBIGEO where coddpto = ? and codprov = ? and coddist = ?  and status = 1', [dpto, prov, id],
    (error, rows) => {
      if (error) {
        printLog(error);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: error});
        return;
      }
      res
        .status(200)
        .json(rows[0]);
    });
};
controller.updateDistrict = (req, res) => {
  let name = req.body.name,
    code = req.params.id,
    coddpto = code.substring(0, 2),
    codprov = code.substring(2, 4),
    coddist = code.substring(4, 6),
    zone = {};

  dbQuery('select 1 from UBIGEO where name = ? and coddist <> ? and coddpto = ? and codprov = ? and coddist <> 0 and status = 1',
    [name, coddist, coddpto, codprov], (err, rows) => {
      if (err) {
        printLog(err);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
        return;
      }

      if (rows.length === 0) {
        zone.name = name;

        dbQuery('update UBIGEO SET ? where code = ?', [zone, code],
          (err) => {
            if (err) {
              printLog(err);
              res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
              return;
            }
            res.json({results: {code: '001', message: 'ok'}});
          });
      } else {
        res
          .status(401)
          .json({results: {code:'error', message: 'El nombre de distrito ya exite' }});
      }
    });
};
controller.deleteDistrict = (req, res) => {
  let coddist = req.params.id.substring(4, 6);

  dbQuery('update UBIGEO set status = "0" where coddist = ?;', [coddist],
    (err) => {
      if (err) {
        printLog(err);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
        return;
      }
      res.json({results: {code: '001', message: 'ok'}});
    });
};

module.exports = controller;