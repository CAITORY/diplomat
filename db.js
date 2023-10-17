const mysql = require('mysql'); 

module.exports = function () {
    return {
      init: function () {
        return mysql.createConnection({
          host: '49.172.51.218',
          port: '3306',
          user: 'caitory',
          password: 'clabbi3177^^',
          database: 'diplomat'
        })
      },
      
      db_open: function (con) {
        con.connect(function (err) {
          if (err) {
            console.error('mysql connection error :' + err);
          } else {
            console.info('mysql is connected successfully.');
          }
        })
      }
    }
  };