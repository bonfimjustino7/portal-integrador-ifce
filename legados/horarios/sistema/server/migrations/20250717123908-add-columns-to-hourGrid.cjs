'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'hour_grid',
        'active',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        { transaction }
      );

      await queryInterface.addColumn(
        'hour_grid',
        'publicated',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        { transaction }
      );
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('hour_grid', 'active', { transaction });
      await queryInterface.removeColumn('hour_grid', 'publicated', { transaction });
      await queryInterface.removeColumn('hour_grid', 'code', { transaction });
    });
  }
};
