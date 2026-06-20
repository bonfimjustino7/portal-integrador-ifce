'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const date = new Date();
    await queryInterface.bulkInsert('calendar', [
      {
        name: '2025.2 - Regular',
        dateStart: date,
        dateEnd: date,
        dateClose: date,
        type: 'Regular',
        period: 2,
        active: true,
        createdAt: date,
        updatedAt: date
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('calendar', null, {})
  }
};
