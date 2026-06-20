'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        'UPDATE calendar SET active = true;',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'UPDATE classes SET active = true;',
        { transaction }
      );
    });
  },

  async down (queryInterface, Sequelize) {
   await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        'UPDATE calendar SET active = false;',
        { transaction }
      );
      await queryInterface.sequelize.query(
        'UPDATE classes SET active = false;',
        { transaction }
      );
    });
  }
};
