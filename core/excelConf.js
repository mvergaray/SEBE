const configs = require('./config'),
    excelConfiguration = {
      closureColumns: ['document', 'date', 'destination', 'address', 'district',
      'sender', 'code', 'location_name', 'status', 'received_by', 'discharged_at',
      'closed_at', 'final_user'],
      defaultColumns: ['document', 'date', 'destination', 'address', 'dpto', 'province', 'district',
      'sender', 'code', 'reference', 'location_name', 'weight', 'contact', 'shipping_type',
      'assigned_to', 'order_id', 'assigned_at', 'binnacle_id', 'status', 'received_by', 'discharged_at',
      'closed_at', 'final_user'],
      closureConfig: {
        stylesXmlFile: configs.PROJECT_PATH + '/server/core/style.xml',
        name: 'Etiquetas',
        cols: [{
          caption: 'N° Doc.',
          type: 'string'
        }, {
          caption: 'Fecha',
          type: 'string'
        }, {
          caption: 'Para',
          type: 'string'
        }, {
          caption: 'Dirección',
          type: 'string'
        }, {
          caption: 'Distrito',
          type: 'string'
        }, {
          caption: 'Por',
          type: 'string'
        }, {
          caption: 'Código',
          type: 'string'
        }, {
          caption: 'Oficina',
          type: 'string'
        }, {
          caption: 'Estado',
          type: 'string'
        }, {
          caption: 'Recepcionado Por',
          type: 'string'
        }, {
          caption: 'Fecha de entrega',
          type: 'string'
        }, {
          caption: 'Fecha de culminación',
          type: 'string'
        }, {
          caption: 'Usuario Final',
          type: 'string'
        }]
      },
      config: {
        stylesXmlFile: configs.PROJECT_PATH + '/server/core/style.xml',
        name: 'Etiquetas',
        cols: [{
          caption: 'N° Doc.',
          type: 'string'
        }, {
          caption: 'Fecha',
          type: 'string'
        }, {
          caption: 'Para',
          type: 'string'
        }, {
          caption: 'Dirección',
          type: 'string'
        }, {
          caption: 'Departamento',
          type: 'string'
        }, {
          caption: 'Provincia',
          type: 'string'
        }, {
          caption: 'Distrito',
          type: 'string'
        }, {
          caption: 'Por',
          type: 'string'
        }, {
          caption: 'Código',
          type: 'string'
        }, {
          caption: 'Referencia',
          type: 'string'
        }, {
          caption: 'Oficina',
          type: 'string'
        }, {
          caption: 'Peso',
          type: 'number'
        }, {
          caption: 'Contacto',
          type: 'string'
        }, {
          caption: 'Tipo de envío',
          type: 'string'
        }, {
          caption: 'Asignado a',
          type: 'string'
        }, {
          caption: '# de orden',
          type: 'string'
        }, {
          caption: 'Fecha de Asingación',
          type: 'string'
        }, {
          caption: 'MANIFIESTO',
          type: 'string'
        }, {
          caption: 'Estado',
          type: 'string'
        }, {
          caption: 'Recepcionado Por',
          type: 'string'
        }, {
          caption: 'Fecha de entrega',
          type: 'string'
        }, {
          caption: 'Fecha de culminación',
          type: 'string'
        }, {
          caption: 'Usuario Final',
          type: 'string'
        }]
      },

      templateConfig: {
        stylesXmlFile: configs.PROJECT_PATH + '/server/core/style.xml',
        name: 'Plantilla',
        cols: [{
          caption: 'Nro. Doc.',
          type: 'string'
        }, {
          caption: 'Fecha',
          type: 'string'
        }, {
          caption: 'Remitente',
          type: 'string'
        }, {
          caption: 'Para',
          type: 'string'
        }, {
          caption: 'Dirección',
          type: 'string'
        }, {
          caption: 'Detalle',
          type: 'string'
        }, {
          caption: 'Departamento',
          type: 'string'
        }, {
          caption: 'Provincia',
          type: 'string'
        }, {
          caption: 'Distrito',
          type: 'string'
        }]
      },

      templateCodeConfig: {
        stylesXmlFile: configs.PROJECT_PATH + '/server/core/style.xml',
        name: 'Plantilla',
        cols: [{
          caption: 'Nro. Doc.',
          type: 'string'
        }, {
          caption: 'Fecha',
          type: 'string'
        }, {
          caption: 'Remitente',
          type: 'string'
        }, {
          caption: 'Para',
          type: 'string'
        }, {
          caption: 'Dirección',
          type: 'string'
        }, {
          caption: 'Detalle',
          type: 'string'
        }, {
          caption: 'Departamento',
          type: 'string'
        }, {
          caption: 'Provincia',
          type: 'string'
        }, {
          caption: 'Distrito',
          type: 'string'
        }, {
          caption: 'Código',
          type: 'string'
        }]
      }
    };

module.exports = excelConfiguration;
