module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ad_workflow',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    timezone: '+08:00',
    logging: false,
  },
  production: {
    username: process.env.DB_USER || 'ad_workflow_user',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'ad_workflow',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    timezone: '+08:00',
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  },
}
