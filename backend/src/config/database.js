const { Sequelize } = require('sequelize')

// Sequelize CLI 需要的配置对象格式
const config = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
  timezone: '+08:00',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true,
  },
}

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config,
)

module.exports = sequelize
module.exports.config = config
