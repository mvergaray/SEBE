var _ = require('lodash');

module.exports = class Record {
  constructor(data = {}, arrayFormat = false){
    var record = {};

    record.legacy_id = '0';
    record.idrecord = data.idrecord || 0;

    record.contact = data.contact || undefined;
    record.weight = data.weight || undefined;
    record.document = data.document || '';
    record.document_type_id = data.document_type_id || '';
    record.reference = data.reference || ''; // It will be ignored when we are creating one by one
    record.status = data.status || 1; // 1: Created, 2 Deleted, 3 Asigned, 4 Discharge, 6 Closed
    record.origin = '2'; // 1: Uploded , 2: created manually

    // Ubigeo , only Clients nad Others have obigeo
    record.dpto = data.dpto || '';
    record.province = data.province || '';
    record.district = data.district || '';
    // @todo: save ubigeo code

    // User , CLient, Others: 1,2,3
    record.delivery_type_id = data.delivery_type_id || 0;
    /**
     * Destionation is 'Para' field
     * Depends of delivery_type_id
     */
    record.destination = '';
    record.dt_user_id = 0;
    record.dt_client_id = 0;
    /**
     * If delivery_type_id 'Usuario' 1
     * address will be office/area
     * If delivery_type_id 'Client' 2 or others
     * address will be direction
     */
    record.address = '';
    record.ubigeo_id = data.dt_others_ubigeo;

    if (data.delivery_type_id == 1) {
      if (data.deliveryUser && data.deliveryUser.value) {
        record.dt_user_id = data.deliveryUser.value.id;
        record.destination = `${data.deliveryUser.value.name} ${data.deliveryUser.value.last_name}`;
        record.address = `${data.deliveryUser.value.office_name} - ${data.deliveryUser.value.area_name}`;
      }
    } else if (data.delivery_type_id == 2){
      if (data.deliveryClient && data.deliveryClient.value) {
        record.dt_client_id = data.deliveryClient.value.id;
        record.destination = `${data.deliveryClient.value.name}`;
        record.address = data.deliveryClient.value.address;
      }

    } else {
      record.destination = data.dt_others_para ||'';
      record.address = data.dt_others_address || '';
    }

    // Fields to be filled only on creation
    if (!data.idrecord) {
      record.date = data.date || new Date(); // creation date
      record.creationCode = data.creationCode || ''; // used when uploading
      record.origin = '2';
      record.sender = '';

      // Logged User
      record.user_id = data.user_id;
      record.created_at = data.created_at || new Date();
      record.created_by = data.user_id;
    } else {
      // Logged User
      record.updated_at = new Date();
      record.updated_by = data.user_id;
    }

    if (data.sender && data.sender.value) {
      let sender = data.sender.value;
      record.sender = `${sender.name} ${sender.last_name}`;
      record.sender_id = sender.id;
      record.client_id = data.sender.value.client_id;
    }

    if (arrayFormat) {
      this.data = [];
      // Use this order based on the INSERT query
      this.data.push(
        record.document,
        record.dpto,
        record.province,
        record.district,
        record.address,
        record.destination,
        record.sender,
        record.reference,
        record.date,
        record.status,
        record.user_id,
        record.created_at,
        record.created_by,
        record.origin,
        record.sender_id,
        record.delivery_type_id,
        record.dt_user_id,
        record.dt_client_id,
        record.document_type_id,
        record.contact,
        record.weight,
        record.ubigeo_id,
        record.client_id
      );
    } else {
      _.merge(this, record);
    }
  }
};
