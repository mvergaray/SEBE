const _ = require('lodash');
let binnacleCtrl = {};

binnacleCtrl.getBinnacle = (binnacle_id) => {
  return new Promise( ( resolve, reject) => {
    var query = 'SELECT LPAD(a.id, 10, \'0\') manifest_code ' +
          ', DATE_FORMAT(a.created_at, \'%d/%c/%Y %H:%i:%s\') manifest_date ' +
          ', a.assignment_type assignment_type_id ' +
          ', UPPER(CONCAT(d.name, \' - \', c.name)) origin ' +
          ', UPPER(a.f_description) service_order ' +
          ', UPPER(a.s_description) ship_type ' +
          ', IF (a.assignment_type = 3, 1, 0) is_internal_client ' +
          ', UPPER(CONCAT(b.name, \' \', b.last_name)) user_name ' +
          ', DATE_FORMAT(a.discharge_date, \'%d/%c/%Y\') discharged_at ' +
          ', a.action_id ' +
          ', a.assigned_id ' +
          ', a.created_by ' +
          'FROM BINNACLE a ' +
          'LEFT JOIN USERS b ON a.created_by = b.id ' +
          'LEFT JOIN AREAS c ON b.locate_area = c.id ' +
          'LEFT JOIN OFFICES d ON c.office_id = d.id ' +
          'WHERE a.ID = ?;';

    dbQuery(query, [binnacle_id], function (err, rows) {
      if (err) {
        reject(err);
      } else {
        resolve(_.first(rows));
      }
    });
  });
};

binnacleCtrl.getBinnaclesByRecord = (record_id) => {
  return new Promise( ( resolve, reject) => {
    var query = 'SELECT LPAD(a.id, 10, \'0\') manifest_code ' +
          ', DATE_FORMAT(a.created_at, \'%d/%c/%Y %H:%i:%s\') manifest_date ' +
          ', a.assignment_type assignment_type_id ' +
          ', UPPER(CONCAT(d.name, \' - \', c.name)) origin ' +
          ', UPPER(a.f_description) f_description ' +
          ', UPPER(a.s_description) s_description ' +
          ', IF (a.assignment_type = 3, 1, 0) is_internal_client ' +
          ', UPPER(CONCAT(b.name, \' \', b.last_name)) user_name ' +
          ', DATE_FORMAT(a.discharge_date, \'%d/%c/%Y\') discharged_at ' +
          ', a.action_id ' +
          ', a.assigned_id ' +
          ', a.created_by ' +
          ' FROM BINNACLE a ' +
          ' LEFT JOIN BINNACLE_RECORDS e ON a.id = e.binnacle_id' +
          ' LEFT JOIN USERS b ON a.created_by = b.id ' +
          ' LEFT JOIN AREAS c ON b.locate_area = c.id ' +
          ' LEFT JOIN OFFICES d ON c.office_id = d.id ' +
          ' WHERE e.record_id = ?;';

    dbQuery(query, [record_id], function (err, rows) {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

binnacleCtrl.getEmployee = (id) => {
  return new Promise( ( resolve, reject) => {
    var query = 'SELECT UPPER(CONCAT(a.first_name, \' \', a.last_name, \' \' ' +
      ', a.second_last_name)) assigned_to, ' +
      '\'-\' contact, ' +
      'UPPER(a.address) destination ' +
      'FROM EMPLOYEES a ' +
      'WHERE a.ID = ?;';

    dbQuery(query, [id], function (err, rows) {
      if (err) {
        reject(err);
      } else {
        resolve(_.first(rows));
      }
    });
  });
};

binnacleCtrl.getOffice = (id) => {
  return new Promise( ( resolve, reject) => {
    var query = 'SELECT UPPER(a.name) assigned_to, ' +
      'UPPER(a.contact) contact, ' +
      'UPPER(a.address) destination ' +
      'FROM OFFICES a ' +
      'WHERE a.ID = ?;';

    dbQuery(query, [id], function (err, rows) {
      if (err) {
        reject(err);
      } else {
        resolve(_.first(rows));
      }
    });
  });
};

binnacleCtrl.getRecordsByBinnacles = (binnacle_ids, isPdf) => {
  return new Promise( ( resolve, reject) => {
    var query = 'SELECT idrecord ' +
      ', IFNULL(UPPER(' +
      (isPdf ?
        'REPLACE(a.document, \'\\n\', \'<br/>\')' :
        'a.document') +
      '), \'\') document ' +
      ', IFNULL(DATE_FORMAT(a.date, \'%d/%c/%Y %H:%i:%s\'), \'\') date ' +
      ', IFNULL(DATE_FORMAT(a.date, \'%d/%c/%Y\'), \'\') short_date ' +
      ', IFNULL(UPPER(a.destination), \'\') destination ' +
      ', IFNULL(UPPER(a.address), \'\') address ' +
      ', IFNULL(UPPER(a.dpto), \'\') dpto ' +
      ', IFNULL(UPPER(a.province), \'\') province ' +
      ', IFNULL(UPPER(a.district), \'\') district ' +
      ', IFNULL(UPPER(a.sender), \'\') sender ' +
      ', IFNULL(UPPER(a.sender_id), \'\') sender_id ' +
      ', IFNULL(UPPER(a.code), \'\') code ' +
      ', IFNULL(UPPER(a.reference), \'\') reference ' +
      ', IFNULL(a.weight, \'\') weight ' +
      ', IFNULL(UPPER(a.contact), \'\') contact ' +

      'FROM RECORDS a ' +
      'LEFT JOIN BINNACLE_RECORDS b ON a.idrecord = b.record_id ' +

      'WHERE b.binnacle_id in (?) and a.STATUS <> 2 ORDER BY b.id ASC;';

    dbQuery(query, [binnacle_ids], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

binnacleCtrl.getRecordsByIds = (record_ids, isTicket) => {
  return new Promise( ( resolve, reject) => {
    var query = 'SELECT idrecord ' +
      ', IFNULL(DATE_FORMAT(a.date, \'%d/%c/%Y %H:%i:%s\'), \'\') date ' +
      ', IFNULL(DATE_FORMAT(a.date, \'%d/%c/%Y\'), \'\') short_date ' +
      ', IFNULL(UPPER(a.destination), \'\') destination ' +
      ', IFNULL(UPPER(a.address), \'\') address ' +
      ', IFNULL(UPPER(a.dpto), \'\') dpto ' +
      ', IFNULL(UPPER(a.province), \'\') province ' +
      ', IFNULL(UPPER(a.district), \'\') district ' +
      ', IFNULL(UPPER(a.sender), \'\') sender ' +
      ', IFNULL(UPPER(a.sender_id), \'\') sender_id ' +
      ', IFNULL(UPPER(a.code), \'\') code ' +
      ', IFNULL(UPPER(document_type.name), \'\') doc_type ' +
      (isTicket ?
        ', UPPER(CASE WHEN LENGTH(a.reference) > 100 ' +
          'THEN CONCAT(SUBSTRING(REPLACE(a.reference, \'\\n\', \'<br/>\'), 1, 100), \'...\') ' +
          'ELSE REPLACE(a.reference, \'\\n\', \'<br/>\') END) reference ' +

        ', UPPER(CASE WHEN LENGTH(a.document) > 100 ' +
          'THEN CONCAT(SUBSTRING(REPLACE(a.document, \'\\n\', \'<br/>\'), 1, 100), \'...\') ' +
          'ELSE REPLACE(a.document, \'\\n\', \'<br/>\') END) document ' :
        ', UPPER(REPLACE(a.reference, \'\\n\', \'<br/>\')) reference ' +
        ', UPPER(REPLACE(a.document, \'\\n\', \'<br/>\')) document ') +
      ', IFNULL(a.weight, \'\') weight ' +
      ', IFNULL(UPPER(a.contact), \'\') contact ' +
      'FROM RECORDS a ' +
      'LEFT JOIN DOCUMENT_TYPE ON a.document_type_id = document_type.id ' +
      'WHERE A.IDRECORD in (?) and A.STATUS <> 2 ORDER BY a.DATE DESC, a.IDRECORD DESC;';

    dbQuery(query, record_ids, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

binnacleCtrl.getUsers = (user_ids, skipPrint, isFull) => {
  return new Promise( ( resolve, reject) => {
    var query = 'SELECT users.id user_id ' +
      ', UPPER(users.name) name ' +
      ', UPPER(users.last_name) last_name ' +
      ', UPPER(CONCAT(users.name, \'\', users.last_name)) display_name ' +
      ', IFNULL(UPPER(CONCAT(offices.name, \' - \', areas.name)), \'\') location_name ' +
      (isFull ? ', IFNULL(UPPER(clients.description), \'\') client ' : '') +
      'FROM AREAS ' +
      'LEFT JOIN OFFICES ON offices.id = areas.office_id ' +
      'LEFT JOIN USERS ON users.locate_area = areas.id ' +
      (isFull ?
        'LEFT JOIN CLIENTS ON offices.client_id = clients.id ' :
        '') +
      'WHERE users.id IN (?);';

    dbQuery(query, [user_ids], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    }, skipPrint);
  });
};

binnacleCtrl.getLastAssignments = (record_ids, is_last, binnacle_id, skipPrint) => {
  return new Promise( ( resolve, reject) => {
    var query = 'SELECT A.record_id ' +
          ', b.assignment_type ' +
          ', IFNULL(UPPER(b.s_description), \'\') shipping_type ' +
          ', IFNULL(UPPER(CONCAT(c.first_name, \' \', c.last_name)), \'\') assigned_to ' +
          ', IFNULL(UPPER(D.name), \'\') assigned_to_office ' +
          ', IFNULL(UPPER(CONCAT(e.name, \' \', e.last_name)), \'\') assigned_to_intern' +
          ', IFNULL(UPPER(b.f_description), \'\') order_id ' +
          ', IFNULL(DATE_FORMAT(b.created_at, \'%d/%c/%Y %H:%i:%s\'), \'\') assigned_at ' +
          ', IFNULL(LPAD(B.id, 10, \'0\') , \'\') binnacle_id ' +
          'FROM BINNACLE B ' +
          'LEFT JOIN BINNACLE_RECORDS A ON A.binnacle_id = B.id AND A.action_id = 1 ' +
          ((is_last) ?
            'AND A.is_last = 1 ' : ''
          ) +
          'LEFT JOIN EMPLOYEES C ON B.assigned_id = C.id ' +
          'LEFT JOIN OFFICES D ON B.assigned_id = D.id ' +
          'LEFT JOIN USERS E ON B.created_by = E.id ' +
          'WHERE A.record_id in (?) ' +

          ((!is_last) ?
            'AND B.id = ? ' : ''
          ) +

          'ORDER BY A.id DESC, b.created_at DESC;',
        params = [record_ids];

    if (!is_last) {
      params.push(binnacle_id);
    }

    dbQuery(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    }, skipPrint);
  });
};

binnacleCtrl.getLastDischarge = (record_ids, is_last, binnacle_id, skipPrint) => {
  return new Promise( ( resolve, reject) => {
    var query = 'SELECT A.record_id ' +
          ', IFNULL(UPPER(B.s_description), \'\') status ' +
          ', IFNULL(UPPER(B.f_description), \'\') received_by ' +
          ', IFNULL(DATE_FORMAT(B.discharge_date, \'%d/%c/%Y %H:%i:%s\'), \'\') discharged_at ' +
          'FROM BINNACLE B ' +
          'LEFT JOIN BINNACLE_RECORDS A ON A.binnacle_id = B.id AND A.action_id = 2 ' +
          ((is_last) ?
            'AND A.is_last = 1 ' : ''
          ) +
          'WHERE A.record_id in (?) ' +
          ((!is_last) ?
            'AND B.id = ? ' : ''
          ) +
          'ORDER BY A.id DESC, b.created_at DESC;',
        params = [record_ids];

    if (!is_last) {
      params.push(binnacle_id);
    }

    dbQuery(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    }, skipPrint);
  });
};

binnacleCtrl.getLastClosure = (record_ids, is_last, binnacle_id, skipPrint) => {
  return new Promise( ( resolve, reject) => {
    var query = 'SELECT A.record_id ' +
          ', IFNULL(DATE_FORMAT(B.created_at, \'%d/%c/%Y %H:%i:%s\'), \'\') closed_at ' +
          ', IFNULL(UPPER(CONCAT(C.name, \' \', C.last_name)), \'\') final_user ' +
          'FROM BINNACLE B ' +
          'LEFT JOIN BINNACLE_RECORDS A ON A.binnacle_id = B.id AND A.action_id = 3 ' +
          ((is_last) ?
            'AND A.is_last = 1 ' : ''
          ) +
          'LEFT JOIN USERS C ON B.assigned_id = C.id ' +
          'WHERE A.record_id in (?) ' +
          ((!is_last) ?
            'AND B.id = ? ' : ''
          ) +
          'ORDER BY A.id DESC, B.created_at DESC;',
        params = [record_ids];

    if (!is_last) {
      params.push(binnacle_id);
    }

    dbQuery(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    }, skipPrint);
  });
};

module.exports = binnacleCtrl;
