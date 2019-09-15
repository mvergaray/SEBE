function Utils() {
    this.months_es = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio',
      'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    this.getMonthText = (index = 0) => {
      return this.months_es[index];
    };

    this.locationCodes = (ubigeo_code) => {
      return {
        dpto: ubigeo_code.slice(0, 2) + '0000',
        prov: `${ubigeo_code.slice(0, 4)}00`,
        dist: ubigeo_code
      };
    };

  }

  module.exports = new Utils();
