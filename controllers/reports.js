const binnacleCtrl = require('./binnacle');
const documentCtrl = require('./documents');
const configs = require('../core/config');
const HOSTPROTOCOL = (configs.enableSSL ? 'https://' : 'http://');
const axios = require('axios');
const _ = require('lodash');
const nodeExcel = require('excel-export');
const excelConf = require('../core/excelConf');
const ResponseUtils = require('../core/ResponseUtils');
const https = require('https');

let pdf = require('html-pdf');
let Controller = {};

/***/
Controller.generateExcel = (req, res) => {
  let params = req.body,
      tickets = params.ids || [''],
      promises = [],
      handleError = (err) => {
        printLog(err);
        ResponseUtils.sendInternalServerError(res, err);
      },
      data = [],
      reportColumns = excelConf.defaultColumns,
      exelConfig = excelConf.config;

  binnacleCtrl.getRecordsByIds([tickets]).then((records) => {
    const user_ids = _.uniq(_.map(records, 'sender_id')) || [],
        record_ids = _.uniq(_.map(records, 'idrecord')) || [],
        shouldLoadUsers = !!(user_ids || []).length;

    promises.push(
      shouldLoadUsers ? binnacleCtrl.getUsers(user_ids): [],
      binnacleCtrl.getLastAssignments(record_ids, true),
      binnacleCtrl.getLastDischarge(record_ids, true),
      binnacleCtrl.getLastClosure(record_ids, true)
    );

    Promise.all(promises).then((result) => {
      _.forEach(records, (record) => {
        let location_name = _.get(_.find(result[0], {user_id: parseInt(record.sender_id, 0)}), 'location_name') || '',
            binnacle = _.find(result[1], {record_id: record.idrecord}) || {},
            discharge = _.find(result[2], {record_id: record.idrecord}) || {},
            closure = _.find(result[3], {record_id: record.idrecord}) || {};

        // Match office by sender_id
        record.location_name = location_name;
        record.shipping_type = binnacle.shipping_type;
        record.assignment_type = binnacle.assignment_type;
        record.assigned_to = (binnacle.assignment_type == 1) ?
          binnacle.assigned_to :
          (binnacle.assignment_type == 2 ? binnacle.assigned_to_office : binnacle.assigned_to_intern);
        record.order_id = binnacle.order_id;
        record.assigned_at = binnacle.assigned_at;
        record.binnacle_id = binnacle.binnacle_id;
        record.status = discharge.status;
        record.received_by = discharge.received_by;
        record.discharged_at = discharge.discharged_at;
        record.closed_at = closure.closed_at;
        record.final_user = closure.final_user;

        data.push(reportColumns.map((key) => {
          return record[key] || '';
        }));
      });


      try {
        exelConfig.rows = data;
        result = nodeExcel.execute(exelConfig);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader('Content-Disposition', 'attachment; filename=Etiquetas.xlsx');
        res.end(result, 'binary');
      } catch (e) {
        handleError(e);
      }
    }, handleError);
  }, handleError);
};

Controller.tickets = (req, res) => {
  let ids = req.body.ids,
    isTicket = req.body.is_ticket + '',
    fileName = isTicket == 1 ? 'Etiquetas' : 'Cargo_de_area_',
    url = `${HOSTPROTOCOL}${configs.BACKEND_HOST}/reports/render-template?is_ticket=${isTicket}&ids=${ids}`;

  // Ignore ssl error
  const agent = new https.Agent({
    rejectUnauthorized: false
  });
  axios.get(url, { httpsAgent: agent })
    .then(response => {
      pdf.create(response.data,
        {
          format: 'A4',
          'border': {
            'top': '0.3in',
            'right': '0.3in',
            'bottom': '0.3in',
            'left': '0.3in'
          },
          'zoomFactor': 1
        })
        .toBuffer((err, buffer) => {
          if (err) {
            printLog(err);
            res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
            return;
          }

          res.type('pdf');
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=' + fileName + '.pdf');
          res.end(buffer, 'binary');
        });

    })
    .catch(error => {
      printLog(error);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: error});
    });
};

Controller.renderTemplate = (req, res) => {
  let params = req.query,
      isTicket = params.is_ticket == 1,
      tickets = _.split(params.ids, ',') || [''],
      manifest = {},
      handleError = (err) => {
        printLog(err);
        ResponseUtils.sendInternalServerError(res, err);
      },
      template = isTicket ? 'ticketsPdf/smallTickets' : 'ticketsPdf/certificate';

  binnacleCtrl.getRecordsByIds([tickets], isTicket).then(
    (records) => {
      let user_ids = _.uniq(_.map(records, 'sender_id')) || [];

      binnacleCtrl.getUsers(user_ids, false, true).then((users) => {
        _.forEach(records, (record) => {
          let user = _.find(users, {user_id: Number(record.sender_id)}) || {},
              // Match office by sender_id
              result = _.merge(record, user);

          return result;
        });

        manifest.documents = records;

        res.render(template, manifest);
      });
    }, handleError);
};

Controller.renderDeliveryConfirmationTemplate = (req, res) => {
  let params = req.query,
      tickets = _.split(params.ids, ',') || [''],
      manifest = {},
      handleError = (err) => {
        printLog(err);
        ResponseUtils.sendInternalServerError(res, err);
      },
      template = 'ticketsPdf/deliveryConfirmation';

  binnacleCtrl.getRecordsByIds([tickets], true).then(
    (records) => {
      let user_ids = _.uniq(_.map(records, 'sender_id')) || [];

      binnacleCtrl.getUsers(user_ids, false, true).then((users) => {
        _.forEach(records, (record) => {
          let user = _.find(users, {user_id: Number(record.sender_id)}) || {},
              // Match office by sender_id
              result = _.merge(record, user);

          return result;
        });

        manifest.documents = records;

        res.render(template, manifest);
      });
    }, handleError);
};

Controller.generateExcelByParams = (req, res) => {
  let params = req.body,
      promises = [],
      filter = {
        code: params.code,
        document: params.document,
        destination: params.destination,
        sender: params.sender,
        created_by: params.created_by,
        reference: params.reference,
        client_id: params.client_id,
        binnacle_id: params.binnacle_id,
        startDate: parseFloat(params.startDate || 0),
        endDate: parseFloat(params.endDate || 0)
      },
      handleError = (err) => {
        printLog(err);
        ResponseUtils.sendInternalServerError(res, err);
      },
      data = [],
      reportColumns = excelConf.defaultColumns,
      exelConfig = excelConf.config;

  documentCtrl.getRecordsByParams(filter, false).then((records) => {
    let user_ids = _.uniq(_.map(records, 'sender_id')) || [],
        record_ids = _.uniq(_.map(records, 'idrecord')) || [],
        shouldLoadUsers = !!(user_ids || []).length;

    promises.push(
      shouldLoadUsers ? binnacleCtrl.getUsers(user_ids, true): [],
      binnacleCtrl.getLastAssignments(record_ids, true, null, true),
      binnacleCtrl.getLastDischarge(record_ids, true, null, true),
      binnacleCtrl.getLastClosure(record_ids, true, null, true)
    );

    Promise.all(promises).then((result) => {
      _.forEach(records, (record) => {
        let location_name = _.get(_.find(result[0], {user_id: parseInt(record.sender_id, 0)}), 'location_name') || '',
            binnacle = _.find(result[1], {record_id: record.idrecord}) || {},
            discharge = _.find(result[2], {record_id: record.idrecord}) || {},
            closure = _.find(result[3], {record_id: record.idrecord}) || {};

        // Match office by sender_id
        record.location_name = location_name;

        record.binnacle_id = binnacle.binnacle_id;
        record.shipping_type = binnacle.shipping_type;
        record.assignment_type = binnacle.assignment_type;
        record.assigned_to = (binnacle.assignment_type == 1) ?
          binnacle.assigned_to :
          (binnacle.assignment_type == 2 ? binnacle.assigned_to_office : binnacle.assigned_to_intern);
        record.order_id = binnacle.order_id;
        record.assigned_at = binnacle.assigned_at;
        record.binnacle_id = binnacle.binnacle_id;

        record.status = discharge.status;
        record.received_by = discharge.received_by;
        record.discharged_at = discharge.discharged_at;
        record.closed_at = closure.closed_at;
        record.final_user = closure.final_user;

        data.push(reportColumns.map((key) => {
          return record[key] || '';
        }));
      });

      try {
        exelConfig.rows = data;
        result = nodeExcel.execute(exelConfig);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader('Content-Disposition', 'attachment; filename=Etiquetas.xlsx');
        res.end(result, 'binary');
      } catch (e) {
        handleError(e);
      }
    }, handleError);
  }, handleError);
};

Controller.print = (req, res) => {
  let id = req.params.id,
      fileName = 'Registro',
      url = `${HOSTPROTOCOL}${configs.BACKEND_HOST}/reports/print-template/${id}`;

  // Ignore ssl error
  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  axios.get(url, { httpsAgent: agent })
      .then(response => {
        pdf.create(response.data,
          {
            format: 'A4',
            'border': {
              'top': '0.3in',
              'right': '0.3in',
              'bottom': '0.3in',
              'left': '0.3in'
            },
            'zoomFactor': 1
          })
          .toBuffer((err, buffer) => {
            if (err) {
              printLog(err);
              res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
              return;
            }

            res.type('pdf');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=' + fileName + '.pdf');
            res.end(buffer, 'binary');
          });

      })
      .catch(error => {
        printLog(error);
        res.status(500).send({code: 500, msg: 'Internal Server Error', dev: error});
      });
};

Controller.printTemplate = (req, res) => {
  let id = req.params.id,
    promises = [],
    handleError = (err) => {
      printLog(err);
      ResponseUtils.sendInternalServerError(res, err);
    };

    binnacleCtrl.getRecordsByIds([id]).then((records) => {
      let record;

      if (records.length) {
        record = _.first(records) || {};

        promises.push(
          binnacleCtrl.getUsers(record.sender_id),
          binnacleCtrl.getBinnaclesByRecord(id)
        );

        Promise.all(promises).then((results) => {
          let user = _.find(results[0], {user_id: parseInt(record.sender_id, 10)});
          // Get first item as the only record

          record.location_name = user.location_name;
          record.binnacle = results[1] || [];

          res.render('binnacle/binnacle', {documents: [record]});
        }, handleError);
      } else {
        res.render('binnacle/binnacle', {documents: {}});
      }
    }, handleError);
};

Controller.getBinnacleExcel = (req, res) => {
  let binnacle_id = req.params.id || -1,
    action_id = req.body.action_id || 1,
    promises = [],
    handleError = (err) => {
      printLog(err);
      ResponseUtils.sendInternalServerError(res, err);
    },
    data = [],
    reportColumns,
    exelConfig,
    shouldLoadClosure;

  // Prepare data for action
  if (action_id == 3) {
    reportColumns = excelConf.closureColumns;
    exelConfig = excelConf.closureConfig;
    shouldLoadClosure = true;
  } else {
    reportColumns = excelConf.defaultColumns;
    exelConfig = excelConf.config;
    shouldLoadClosure = false;
  }

  binnacleCtrl.getRecordsByBinnacles([binnacle_id]).then((records) => {
    let user_ids = _.uniq(_.map(records, 'sender_id')) || [],
        record_ids = _.uniq(_.map(records, 'idrecord')) || [],
        shouldLoadUsers = !!(user_ids || []).length;

    promises.push(
      shouldLoadUsers ? binnacleCtrl.getUsers(user_ids): [],
      !shouldLoadClosure ? binnacleCtrl.getLastAssignments(
        record_ids, action_id != 1, binnacle_id) : [],
      binnacleCtrl.getLastDischarge(
        record_ids, action_id != 2, binnacle_id),
      shouldLoadClosure ? binnacleCtrl.getLastClosure(
        record_ids, action_id != 3, binnacle_id) : []
    );

    Promise.all(promises).then((result) => {
      _.forEach(records, (record) => {
        let location_name = _.get(_.find(result[0], {user_id: parseInt(record.sender_id, 0)}), 'location_name') || '',
            binnacle = _.find(result[1], {record_id: record.idrecord}) || {},
            discharge = _.find(result[2], {record_id: record.idrecord}) || {},
            closure = _.find(result[3], {record_id: record.idrecord}) || {};

        // Match office by sender_id
        record.location_name = location_name;
        if (!shouldLoadClosure) {
          record.shipping_type = binnacle.shipping_type;
          record.assignment_type = binnacle.assignment_type;
          record.assigned_to = (binnacle.assignment_type == 1) ?
            binnacle.assigned_to :
            (binnacle.assignment_type == 2 ? binnacle.assigned_to_office : binnacle.assigned_to_intern);
          record.order_id = binnacle.order_id;
          record.assigned_at = binnacle.assigned_at;
          record.binnacle_id = binnacle.binnacle_id;
        }

        record.status = discharge.status;
        record.received_by = discharge.received_by;
        record.discharged_at = discharge.discharged_at;
        record.closed_at = closure.closed_at;
        record.final_user = closure.final_user;

        data.push(reportColumns.map((key) => {
          return record[key] || '';
        }));
      });

      try {
        exelConfig.rows = data;
        result = nodeExcel.execute(exelConfig);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader('Content-Disposition', 'attachment; filename=Etiquetas.xlsx');
        res.end(result, 'binary');
      } catch (e) {
        handleError(e);
      }
    }, handleError);
  }, handleError);
};

Controller.getBinnacle = (req, res) => {
  let binnacle_id = req.params.id + '',
    action = req.body.action_id == 1 ? 'binnacle-assignment' : 'binnacle-closure',
    url = `${HOSTPROTOCOL}${configs.BACKEND_HOST}/reports/${action}/${binnacle_id}`,
    padString = '0000000000',
    fileName = padString.substring(0, padString.length - binnacle_id.length) + binnacle_id;

  // Ignore ssl error
  const agent = new https.Agent({
    rejectUnauthorized: false
  });

  axios.get(url, { httpsAgent: agent })
    .then(response => {
      pdf.create(response.data,
        {
          format: 'A4',
          'border': {
            'top': '0.3in',
            'right': '0.3in',
            'bottom': '0.3in',
            'left': '0.3in'
          },
          'zoomFactor': 1
        })
        .toBuffer((err, buffer) => {
          if (err) {
            printLog(err);
            res.status(500).send({code: 500, msg: 'Internal Server Error', dev: err});
            return;
          }

          res.type('pdf');
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'attachment; filename=' + fileName + '.pdf');
          res.end(buffer, 'binary');
        });

    })
    .catch(error => {
      printLog(error);
      res.status(500).send({code: 500, msg: 'Internal Server Error', dev: error});
    });
};

Controller.getAssignments = (req, res) => {
  let binnacle_id = req.params.id,
    handleError = (err) => {
      printLog(err);
      ResponseUtils.sendInternalServerError(res, err);
    },
    binnacle,
    recordsCall = function () {
      binnacleCtrl.getRecordsByBinnacles([binnacle_id], true).then((records) => {
        binnacle.table = records;
        res.status(200).render('binnacle/assignments', binnacle);
        return;
      }, handleError);
    };

  binnacleCtrl.getBinnacle(binnacle_id).then((data)=>{
    binnacle = data;

    if (!_.isEmpty(binnacle)) {
      let assingment_data = _.get([binnacleCtrl.getEmployee(binnacle.assigned_id),
        binnacleCtrl.getOffice(binnacle.assigned_id)], (binnacle.assignment_type_id - 1));

      binnacle.assignment_type = binnacle.assignment_type_id == 1 ?
        'EMPLEADO' : binnacle.assignment_type_id == 2 ?
        'OFICINA' : 'INTERNO';

      if (binnacle.assignment_type_id == 3) {
        binnacle.assigned_to = binnacle.user_name;
        binnacle.contact = '-';
        binnacle.destination = '-';
        recordsCall();
      } else {
        assingment_data.then((data) => {
          if (!_.isEmpty(data)) {
            binnacle.assigned_to = data.assigned_to;
            binnacle.contact = data.contact;
            binnacle.destination = data.destination;
          } else {
            printLog('No assignee found');
          }

          recordsCall();
        }, handleError);
      }
    } else {
      printLog('Not binnacle returned');
      res.status(200).render('binnacle/assignments', {no_data: true});
    }
  }, handleError);
};

Controller.getClosures = (req, res) => {
  let binnacle_id = req.params.id,
    handleError = (err) => {
      printLog(err);
      ResponseUtils.sendInternalServerError(res, err);
    },
    binnacle;
  try {
    binnacleCtrl.getBinnacle(binnacle_id).then((data) => {
      let promises = [];

      if (!_.isEmpty(data)) {
        binnacle = data;

        promises.push(
          binnacleCtrl.getUsers(_.without([binnacle.assigned_id, binnacle.created_by])),
          binnacleCtrl.getRecordsByBinnacles([binnacle_id], true)
        );

        Promise.all(promises).then((result) => {
          let dischargePromise = [];

          try {
            let assign_to = _.find(result[0], {user_id: binnacle.assigned_id}) || {},
                created_by = _.find(result[0], {user_id: binnacle.created_by}) || {};

            binnacle.assign_to = `${assign_to.name} ${assign_to.last_name}`;
            binnacle.address = assign_to.location_name;
            binnacle.origin = created_by.location_name;
            binnacle.table = result[1];

            if (binnacle.action_id == 3) {
              dischargePromise.push(binnacleCtrl.getLastDischarge(_.map(binnacle.table, 'idrecord'), true));
            }

            Promise.all(dischargePromise).then((discharge) => {
              if (binnacle.action_id == 3) {
                _.forEach(binnacle.table, (record) => {
                  record.status = (_.find(_.get(discharge, 0), {record_id: record.idrecord}) || {}).status;
                });
              }

              res.status(200).render('binnacle/closures', binnacle);
            }, handleError);
          } catch (e) {
            printLog(e);
            res.render('binnacle/closures', {no_data: true});
          }
        }, handleError);
      } else {
        printLog('Not binnacle returned');
        res.render('binnacle/closures', {no_data: true});
      }
    }, handleError);
  } catch (e) {
    printLog(e);
    res.render('binnacle/closures', {no_data: true});
  }
};

module.exports = Controller;
