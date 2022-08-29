const {Pool} = require('pg')

const dbPool = new Pool ({
    database: 'personal_web_b39',
    port: 8000,
    user: 'postgres',
    password: 'my1fb000'
})

module.exports = dbPool