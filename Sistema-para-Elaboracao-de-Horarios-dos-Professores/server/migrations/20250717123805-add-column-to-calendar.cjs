'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        'calendar',
        'active',
        {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        { transaction }
      );

      await queryInterface.sequelize.query(
        'UPDATE calendar SET active = false;',
        { transaction }
      );

      await queryInterface.changeColumn(
        'calendar',
        'active',
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
        },
        { transaction }
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('calendar', 'active');
  }
};
