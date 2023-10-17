module.exports = [{
    script: 'index.js',
    name: 'caitory_test',
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    // env_production : {
    //     "NODE_ENV": "develoment"
    // },
    exec_mode: 'cluster',
    instances: 1
}]
