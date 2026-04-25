'use strict'

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('clients')
    if (!table.is_admin) {
      await queryInterface.addColumn('clients', 'is_admin', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      })
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('clients', 'is_admin')
  },
}
