const Pool = require('pg').Pool
const pool = new Pool({
  user: 'ubuntu',
  host: 'ec2-54-67-95-168.us-west-1.compute.amazonaws.com',
  database: 'ubuntu',
  password: 'admin',
  port: 5432,
})

module.exports = {pool: pool}