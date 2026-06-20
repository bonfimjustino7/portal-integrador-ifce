'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('users','registration');
  },

  async down (queryInterface, Sequelize) {
  }
};
