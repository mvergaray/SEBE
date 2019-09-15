var mysql = require('mysql'),
    configs = require('./config'),
    connection = mysql.createConnection({
      host     : configs.mysql_host,
      user     : configs.mysql_user,
      port     : configs.mysql_port,
      password : configs.mysql_password,
      database : configs.mysql_database,
      multipleStatements: true,
      waitForConnection: true,
      timezone: '-05'
    });

module.exports = connection;
