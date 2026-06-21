'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE classes
      SET turnId = 1
      WHERE turnId IS NULL;
    `);

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      UPDATE classes
      SET turnId = null
      WHERE turnId IS NOT NULL;
    `);
  }
};
