const Pool = require('pg').Pool
const pool = new Pool({
  user: 'ubuntu',
  host: 'ec2-54-241-58-21.us-west-1.compute.amazonaws.com',
  database: 'ubuntu',
  password: 'yeeter',
  port: 5432,
})

module.exports = {pool: pool}