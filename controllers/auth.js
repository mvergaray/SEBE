var bcrypt = require('bcryptjs');

var AuthCtrl = {};

AuthCtrl.authUser = (username, password, done) => {
  // Verify user name
  var usernameLowerCase = username.toLowerCase().trim(),
      query = 'SELECT a.*, CONCAT(c.name, \' - \', b.name) origin FROM USERS a' +
        ' LEFT JOIN AREAS b ON a.locate_area = b.id' +
        ' LEFT JOIN OFFICES c ON b.office_id = c.id' +
        ' WHERE a.STATUS > 0 ' +
        ' AND USERNAME LIKE ?;',
      user = {};

  dbQuery(query, [usernameLowerCase], (err, rows) => {
    if (err) {
      printLog(err);
      done(null, false, {message: 'bad Name'});
      return;
    } else if (rows && rows.length) {
      user = rows[0];

      if (user.status == 2) {
        printLog('User status is inactive');
        done(null, false, {code: 500, msg: 'Usuario inactivo'});
        return;
      }

      // Add allowed clients to the user session
      if (bcrypt.compareSync(password, user.password)) {
        // Add allowed clients to the user session
        dbQuery('select client_id from USERS_CLIENTS where user_id = ?', [user.id], function (err, rows) {
          if (err) {
            printLog(err);
            done(null, false, err);
            return;
          } else if (rows && rows.length) {
            user.clients = rows.map((item) => {
              return item.client_id;
            });
          }

          query = 'select e.name, r._view, r._create, r._edit, r._delete  ' +
                'from ENTITIES e ' +
                'left join RESTRICTIONS r  on e.id = r.entity_id and r.user_id = ? ';

          dbQuery(query, [user.id], (err, rows) => {
            if (err) {
              printLog(err);
              done(null, false, err);
              return;
            } else {
              user.restrictions = {};
              if (rows && rows.length) {
                rows.forEach(function (item) {
                  user.restrictions[item.name] = item;
                });
              }
              done(null, user);
            }
          });
        });

      } else {
        printLog('Pass: ' + username + ' not found');
        done(null, false, {message: 'bad passoword'});
        isLogginFail = true;
      }
    } else {
      printLog('Username: ' + username + ' not found');
      done(null, false, {code: 500, msg: 'Usuario no encontrado'});
      isLogginFail = true;
    }
  });
};

AuthCtrl.getUser = (req, res) => {

  // check if it is ok or not
  // aqui se puede hacer la busqueda del usuario
  var query = 'SELECT a.*, CONCAT(c.name, \' - \', b.name) origin FROM USERS a' +
        ' LEFT JOIN AREAS b ON a.locate_area = b.id' +
        ' LEFT JOIN OFFICES c ON b.office_id = c.id' +
        ' WHERE a.STATUS > 0 ' +
        ' AND USERNAME LIKE ?;',
      user = {};

  dbQuery(query, [req.user.username], function (err, rows) {
    if (err) {
      printLog(err);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
      return;
    } else if (rows && rows.length) {
      user = rows[0];

      if (user.status == 2) {
        printLog('User status is inactive');
        res.status(500).send({code: 500, msg: 'Usuario inactivo'});
        return;
      }
      // Add allowed clients to the user session
      dbQuery('select client_id from USERS_CLIENTS where user_id = ?;', [user.id], function (err, rows) {
        if (rows && rows.length) {
          user.clients = rows.map(function (item) {
            return item.client_id;
          });
        }

        query = 'select e.name, r._view, r._create, r._edit, r._delete  ' +
              'from ENTITIES e ' +
              'left join RESTRICTIONS r  on e.id = r.entity_id and r.user_id = ?;';

        dbQuery(query, [user.id], function (err, rows) {
          user.restrictions = {};
          if (rows && rows.length) {
            rows.forEach(function (item) {
              user.restrictions[item.name] = item;
            });
          }

          delete user.password;
          res.json(user);
        });
      });
    } else {
      printLog('Username: ' + req.user.username + ' not found');
      res.status(500).send({code: 500, msg: 'Usuario no encontrado'});
    }
  });
};


module.exports = AuthCtrl;