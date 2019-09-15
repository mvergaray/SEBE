module.exports = class Binnacle {
    constructor(params) {
      this.created_at = params.created_at || new Date();
      this.created_by = params.created_by || 0;

      this.action_id = params.action_id || 0;

      this.f_description = params.f_description;
      this.s_description = params.s_description;
      this.discharge_date = params.discharge_date;
      this.assigned_id = params.assigned_id;

      if (this.s_description == 'Otros') {
        this.s_description = `${this.s_description}: ${params.s_description_extra}`;
      }
    }
  };
