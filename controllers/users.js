const extend = require('util')._extend;
const responseUtils = require('../core/ResponseUtils');
let bcrypt = require('bcryptjs');
let UserCtrl = {};

UserCtrl.getUsers = (req, res) => {
  let filter = {
        name: req.query.name,
        pageStart: parseInt(req.query.skip || 0, 10),
        pageCount: parseInt(req.query.limit || 0, 10),
        orderBy: ''
      },
      dataQuery = 'SELECT U.id, U.name, U.last_name, U.status, U.role_id, U.legacy_id, U.employee_id, ' +
        'U.username, C.id locate_client, O.id locate_office, U.locate_area, ' +
        'C.description as client_name, C.id client_id, O.name as office_name, ' +
        'A.name as area_name, ' +
        'UB.code ubigeo_id, UB.name ubigeo_desc ' +
        'FROM USERS U ' +
        'LEFT JOIN AREAS A ON U.locate_area = A.id ' +
        'LEFT JOIN OFFICES O ON A.office_id = O.id ' +
        'LEFT JOIN CLIENTS C ON O.client_id = C.id ' +
        'LEFT JOIN UBIGEO UB ON UB.id = U.ubigeo_id_id ' +
        'WHERE 1 ',
      countQuery = 'SELECT COUNT(u.ID) AS COUNTER FROM USERS U WHERE 1 ',
      commonQuery = 'AND U.STATUS >= 1 ',
      dataParams = [],
      countParams = [],
      name;

  // Set order expression
  if (req.query.sort) {
    filter.orderBy = 'u.' + req.query.sort + ' ' + req.query.sort_dir;
  }

  if (filter.name) {
    name = '%' + filter.name.replace(/ /g, '%') + '%';

    commonQuery += 'AND (CONCAT_WS(" ", U.NAME, U.LAST_NAME) LIKE ? ';
    commonQuery += 'OR U.USERNAME LIKE ?) ';
    dataParams.push(name, name);
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
    dataQuery += 'U.ID ASC ';
  }

  // Set always an start for data
  dataQuery += ' LIMIT ?';
  dataParams.push(filter.pageStart);

  if (filter.pageCount) {
    dataQuery += ', ?';
    dataParams.push(filter.pageCount);
  } else {
    // Request 50 records at most if limit is not specified
    dataQuery += ', 50';
  }

  dataQuery += ';';
  countQuery += ';';

  // Execute both queries at once
  dataParams = dataParams.concat(countParams);

  dbQuery(dataQuery + countQuery, dataParams, function (err, rows) {
    if (err) { responseUtils.sendInternalServerError(res, err); }

    rows = rows || [[]];

    // Exra info
    rows[0].forEach((item) => {item.full_name = `${item.name} ${item.last_name}`;});

    res.status(200).json({
      results: {
        list:rows[0],
        count: rows[1][0].COUNTER
      }
    });
  });
}

UserCtrl.saveUsers = (req, res) => {
  let usernameLowerCase = req.body.username.toLowerCase().trim();

  dbQuery('select * from users where username = ? and status > 0', [usernameLowerCase], function (err, rows) {
    let query,
        userClientQuery = [],
        userClientQueryParams = [],
        uCQueries = '',
        uEntities = [],
        uEQueries = '',
        hash = bcrypt.hashSync(req.body.password, 10),
        queryParams;

    if (rows && rows.length) {
      printLog(err);
      res
        .status(422) // unprocessable entity
        .json({error: 422, message: 'El nombre de usuario no está disponible.'});
      return;
    } else {
      query = 'INSERT INTO USERS SET ?';

      queryParams = {
        username: usernameLowerCase,
        name: req.body.name,
        last_name: req.body.last_name,
        password: hash,
        status: req.body.status,
        role_id: req.body.role_id,
        locate_area: req.body.locate_area,
        ubigeo_id: req.body.ubigeo_id || null,
        ubigeo_id_id: req.body.ubigeo_id_id || null,
        created_at: new Date(),
        created_by: req.user && req.user.id || -1
      };

      if (req.body.legacy_id) {
        queryParams.legacy_id = req.body.legacy_id;
      }
      if (req.body.employee_id) {
        queryParams.employee_id = req.body.employee_id;
      }

      // Insert USER data
      dbQuery(query, [queryParams], function (err, result) {
        let userID;

        if (err) {
          printLog(err);
          return res.status(500).send({code: 500, message: 'Internal Server Error', dev: err});
        }

        if (req.body.employee_id) {
          queryParams.employee_id = req.body.employee_id;
        }

        userID = result.insertId;
        // Insert allowed Clients
        if (req.body.clients && req.body.clients.length) {
          req.body.clients.forEach(function (item) {
            if (item.selected === true) {
              userClientQuery.push(' INSERT into USERS_CLIENTS SET user_id = ? , client_id = ? ; ');
              userClientQueryParams.push(userID);
              userClientQueryParams.push(item.id); // CLIENT ID
            }
          });

          if (userClientQuery.length) {
            uCQueries = userClientQuery.join('');
          }
        }

        // Insert restrictions
        if (req.body.entities && req.body.entities.length) {
          uEQueries = ' delete from RESTRICTIONS where user_id = ? ;';
          userClientQueryParams.push(userID);

          req.body.entities.forEach(function (item) {
            uEntities.push(' INSERT INTO RESTRICTIONS ' +
              '(entity_id, user_id, _view, _create, _edit, _delete) values (?,?,?,?,?,?); ');

            userClientQueryParams.push(item.id);
            userClientQueryParams.push(userID);
            userClientQueryParams.push(item._view || 0);
            userClientQueryParams.push(item._create || 0);
            userClientQueryParams.push(item._edit || 0);
            userClientQueryParams.push(item._delete || 0);
          });
          // Remove previous restrictions
          uEQueries += uEntities.join('');
        }
        // Insert restrictions and clients
        dbQuery(uCQueries + uEQueries, userClientQueryParams, function (err) {
          if (err) {
            printLog(err);
            return res.status(500).send({code: 500, message: 'Internal Server Error', dev: err});
          } else {
            // Save transaction
            res.status(201) // new resource was created
              .json({results:{code:1, message: 'ok', data: req.body}});
          }
        });
      });
    }
  });
}

UserCtrl.updatePasswords = (req, res) => {
  var hash = bcrypt.hashSync(req.body.password, 10),
      query = 'UPDATE USERS SET ' +
      ' password = "' + hash + '"  ' +
      ' where id = ' + req.user.id;

  if (!bcrypt.compareSync(req.body.oldPassword, req.user.password)) {
    res.status(200).send({code: 200, message: 'Su clave actual no coincide, Por favor asegurese de ' +
      'ingresar su clave actual correctamente'});
    return;
  }

  dbQuery(query, function (err) {
    if (err) {
      printLog(err);
      res
        .status(500)
        .send({code: 500, message: 'Internal Server Error', dev: err, sql: query});
        // utils.sendInternalServerError(res);
      return;
    }

    // Update current password
    req.user.password = req.body.password;
    res.status(200).json({results:{code: '001', message: 'ok', data: req.body}});
  });
}

  // Routes for Users Feature
UserCtrl.getUserById = (req, res) => {
  var user,
      query = 'SELECT U.id, U.name, U.last_name, U.status, U.role_id, U.legacy_id, U.employee_id, ' +
        'U.username, O.client_id locate_client, O.id locate_office, A.id locate_area, ' +
        'O.name as office_name, A.name as area_name, ' +
        'UB.code ubigeo_id, UB.id ubigeo_id_id, UB.name ubigeo_desc ' +
        'FROM USERS U ' +
        'LEFT JOIN AREAS A ON U.locate_area = A.ID ' +
        'LEFT JOIN OFFICES O ON A.OFFICE_ID = O.ID ' +
        'LEFT JOIN UBIGEO UB ON U.UBIGEO_ID_ID = UB.ID ' +
        'WHERE U.ID = ?;',
      CQuery, // client query
      RQuery; // restriction query

  // Add user_clients into the user json
  CQuery = 'SELECT c.id, c.description, IF(uc.id, true, null) selected  ' +
    ' from CLIENTS c  ' +
    ' left join USERS_CLIENTS uc on uc.client_id = c.id and uc.status = 1 and uc.user_id = ? ' +
    ' where c.status = 1;';

  // Add entity restrictions
  RQuery = 'SELECT e.id, e.`name`, e.display_name, r._view, r._create, r._edit, r._delete ' +
    'from ENTITIES e  ' +
    'left join RESTRICTIONS r on r.entity_id = e.id and r.user_id = ?;';

  dbQuery(query, req.params.id, function (err, results) {
    if (err) {
      printLog(err);
      res.status(500).send({code: 500, message: 'Internal Server Error', dev: err});
      return;
    }

    // Custom attributes
    user = results[0];
    dbQuery(CQuery, req.params.id, function (errC, resultsC) {
      if (errC) {
        printLog(errC);
        res.status(500).send({code: 500, message: 'Internal Server Error', dev: errC});
        return;
      }

      // Custom attributes
      user.clients = resultsC;

      dbQuery(RQuery, req.params.id, function (errR, resultsR) {
        if (errR) {
          printLog(errR);
          res.status(500).send({code: 500, message: 'Internal Server Error', dev: errR});
          return;
        }

        // Custom attributes
        user.entities = resultsR;
        user.full_name = `${user.name} ${user.last_name}`;
        res.status(200).json(user);
      });
    });
  });
}

UserCtrl.updateUserById = (req, res) => {
  var usernameLowerCase = req.body.username.toLowerCase().trim(),
      verifyUsernameQuery = 'select count (*) total from USERS ' +
      'where username = ? and status > 0 and id <> ' + req.params.id,
      query = 'UPDATE USERS SET ? where id = ? ; ' +
        'delete from USERS_CLIENTS where user_id = ?;', // Remove all rows related to add new ones
      userClientQuery = [],
      uCQueries = '',
      uEntities = [],
      uEQueries = '',
      queryParams,
      queryWhereParam = req.params.id,
      funcExec;

  funcExec = function () {
    queryParams = {
      username: usernameLowerCase,
      name: req.body.name,
      last_name: req.body.last_name,
      status: req.body.status,
      role_id: req.body.role_id,
      locate_area: req.body.locate_area,
      ubigeo_id: req.body.ubigeo_id,
      ubigeo_id_id: req.body.ubigeo_id_id,
      legacy_id: req.body.legacy_id || 0,
      employee_id: req.body.employee_id || 0,
      updated_at: new Date(),
      updated_by: req.user && req.user.id || -1
    };

    // Insert allowed Clients
    if (req.body.clients && req.body.clients.length) {
      req.body.clients.forEach(function (item) {
        if (item.selected === true) {
          userClientQuery.push('insert into USERS_CLIENTS SET ' +
            '   user_id = ' + req.params.id +
            ' , client_id = ' + item.id);
        }
      });

      if (userClientQuery.length) {
        uCQueries = userClientQuery.join(';');
        uCQueries += ';';
      }
    }

    // Insert restrictions
    if (req.body.entities && req.body.entities.length) {
      req.body.entities.forEach(function (item) {
        uEntities.push('insert into RESTRICTIONS set ' +
          ' entity_id =' + item.id +
          ' , user_id =' + req.params.id +
          ' , _view = ' + (item._view || 0) +
          ' , _create = ' + (item._create || 0) +
          ' , _edit = ' + (item._edit || 0) +
          ' , _delete = ' + (item._delete || 0) + '');
      });
      // Remove previous restrictions
      uEQueries = ' delete from RESTRICTIONS where user_id = ' + req.params.id + ';'
        + uEntities.join(';');
    }

    dbQuery(verifyUsernameQuery, [usernameLowerCase], function (err, rows) {
      var existUsername = rows[0].total > 0;

      if (existUsername) {
        res.status(422).send({code: 422, message: 'El nombre de usuario ya existe', dev: err});
      } else {
        dbQuery(query + uCQueries + uEQueries, [queryParams, queryWhereParam, queryWhereParam], function (err) {
          if (err) {
            printLog(err);
            res.status(500).send({code: 500, message: 'Internal Server Error', dev: err});
            return;
          }

          if (req.user.id == req.params.id) {
            // Update current username
            req.user.username = usernameLowerCase;
          }

          res
            .status(204)
            .json({results:{code:1, message: 'ok', data: req.body}});
        });
      }
    });
  };

  if (req.user.role_id != 2) {
    dbQuery('SELECT * FROM USERS WHERE ID = ?;', [req.params.id], function (err, rows) {
      if (err) {
        printLog(err);
        res.status(500).send({code: 500, message: 'Internal Server Error', dev: err});
        return;
      }

      if (rows && rows.length) {
        if (rows[0].role_id == 2) {
          printLog('Usuario: ' + req.user.id + ' intenta actualizar usuario' + rows[0].id);
          res.status(500).send({code: 500, message: 'No está autorizado para actualizar un Administrador', dev: err});
          return;
        } else {
          funcExec();
        }
      }
    });
  } else {
    funcExec();
  }
}

UserCtrl.deleteUserById = (req, res) => {
  var id = req.params.id,
      user = {
        // Set default values
        updated_at: new Date(),
        status: -1,
        updated_by: req.user && req.user.id || -1
      };

  if (req.user.id == id) {
    res.status(401).json({results: {code:'error', message: 'Acción prohibida'}});
    return;
  }

  dbQuery('UPDATE USERS SET ? WHERE ID = ?;', [user, id], function (err) {
    if (err) {
      printLog(err);
      res.status(500).send({code: 500, message: 'Internal Server Error', dev: err});
      return;
    }

    res.status(200).json({result: {code: '001', message: 'ok'}});
  });
}

UserCtrl.getUsersShort = (req, res) => {
  var filter = {
        id: req.query.id,
        name: req.query.name,
        pageStart: parseInt(req.query.skip || 0, 10),
        pageCount: parseInt(req.query.limit || 0, 10),
        orderBy: ''
      },
      dataQuery = 'SELECT U.id, U.name, U.last_name, U.status, U.role_id, U.legacy_id, U.employee_id, ' +
        'U.username, U.locate_area ' +
        'FROM USERS U ' +
        'WHERE 1 ',
      countQuery = 'SELECT COUNT(U.ID) AS COUNTER FROM USERS U WHERE 1 ',
      commonQuery = 'AND U.STATUS >= 1 ',
      dataParams = [],
      countParams = [],
      name;

  // Set order expression
  if (req.query.sort) {
    filter.orderBy = 'u.' + req.query.sort + ' ' + req.query.sort_dir;
  }

  if (filter.name) {
    name = '%' + filter.name.replace(/ /g, '%') + '%';

    commonQuery += 'AND (CONCAT_WS(" ", U.NAME, U.LAST_NAME) LIKE ? ';
    commonQuery += 'OR U.USERNAME LIKE ?) ';
    dataParams.push(name, name);
  }

  if (filter.id) {
    commonQuery += 'AND U.ID = ? ';
    dataParams.push(filter.id);
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
    dataQuery += 'U.ID ASC ';
  }

  // Set always an start for data
  dataQuery += ' LIMIT ?';
  dataParams.push(filter.pageStart);

  if (filter.pageCount) {
    dataQuery += ', ?';
    dataParams.push(filter.pageCount);
  } else {
    // Request 50 records at most if limit is not specified
    dataQuery += ', 50';
  }

  dataQuery += ';';
  countQuery += ';';

  // Execute both queries at once
  dataParams = dataParams.concat(countParams);

  dbQuery(dataQuery + countQuery, dataParams, function (err, rows) {
    if (err) { responseUtils.sendInternalServerError(res, err); }

    rows = rows || [[]];

    // Exra info
    rows[0].forEach((item) => {item.full_name = `${item.name} ${item.last_name}`;});

    res.status(200).json({
      results: {
        list:rows[0],
        count: rows[1][0].COUNTER
      }
    });
  });
}

// Routes for Users Feature, password tab
UserCtrl.updatePasswordById = (req, res) => {
  var hash = bcrypt.hashSync(req.body.password, 10),
      query = 'UPDATE USERS SET  password = ? where id = ?',
      queryParams = [hash, req.params.id];

  dbQuery(query, queryParams, function (err) {
    if (err) {
      printLog(err);
      res
        .status(500)
        .send({code: 500, message: 'Internal Server Error', dev: err, sql: query});
      return;
    }

    if (req.user.id == req.params.id) {
      // Update current username
      req.user.password = req.body.password;
    }

    res.status(200).json({results: {code: '001', message: 'ok', data: req.body}});
  });
}

module.exports = UserCtrl;