'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('hour_grid', 'code', { transaction });
    });
  },

  async down (queryInterface, Sequelize) {
     await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'hour_grid',
        'code',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction }
      );
    });
  }
};
