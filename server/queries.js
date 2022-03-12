const Pool = require('pg').Pool
const pool = new Pool({
  user: 'ubuntu',
  host: '172.31.7.143',
  database: 'ubuntu',
  password: 'yeeter',
  port: 5432,
})

module.exports = {pool: pool}