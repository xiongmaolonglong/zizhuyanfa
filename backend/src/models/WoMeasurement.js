const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

module.exports = sequelize.define('WoMeasurement', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  work_order_id: { type: DataTypes.INTEGER, allowNull: false },
  measurer_id: { type: DataTypes.INTEGER, allowNull: false },
  basic_info: { type: DataTypes.JSON },
  materials: { type: DataTypes.JSON },
  face_name: { type: DataTypes.STRING(200) },
  width: { type: DataTypes.DECIMAL(10, 2) },
  height: { type: DataTypes.DECIMAL(10, 2) },
  area: { type: DataTypes.DECIMAL(10, 2) },
  depth: { type: DataTypes.DECIMAL(10, 2) },
  photos: { type: DataTypes.JSON },
  notes: { type: DataTypes.TEXT },
  signature_path: { type: DataTypes.STRING(500) },
  status: { type: DataTypes.ENUM('measuring', 'measured', 'rejected'), defaultValue: 'measuring' },
  rejection_reason: { type: DataTypes.TEXT },
  measured_at: { type: DataTypes.DATEONLY },
  is_proxy: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'wo_measurements',
  underscored: true,
  paranoid: true,
  freezeTableName: true,
  charset: 'utf8mb4',
  hooks: {
    beforeSave: async (measurement) => {
      if (measurement.materials && Array.isArray(measurement.materials)) {
        for (const material of measurement.materials) {
          if (material.faces && Array.isArray(material.faces)) {
            for (const face of material.faces) {
              if (face.width != null && face.height != null && face.area == null) {
                face.area = face.width * face.height
              }
            }
          }
        }
      }
    },
  },
})
