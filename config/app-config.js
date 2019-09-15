/**
 * Template to config the enviroment
 *  Please create this file in /server/core/config.js
 */

module.exports = {
  SERVER_IP: '',
  FILE_SERVER: 'http://190.40.120.254/',
  PORT: 80,
  RECEIPT_FILES_PATH: 'D:/Cargos_NO_BORRAR/',
  MANIFEST_FILES_PATH: 'D:/Cargos_NO_BORRAR/',
  PROJECT_PATH: '',
  REDIRECT_TO: '',
  mysql_host: 'localhost',
  mysql_port: '3306',
  mysql_user: 'root',
  mysql_password: '123',
  mysql_database: 'superenvios',
  enableSSL: false,
  PRIVATE_KEY_PATH: '/Users/macoy/.ssh/nodesekey',
  PUBLIC_KEY_PATH: '/Users/macoy/.ssh/nodesekey',
  privateKey: '/etc/letsencrypt/live/superenvios.pe/privkey.pem',
  certificate: '/etc/letsencrypt/live/superenvios.pe/cert.pem',
  ca: '/etc/letsencrypt/live/superenvios.pe/chain.pem'
};
