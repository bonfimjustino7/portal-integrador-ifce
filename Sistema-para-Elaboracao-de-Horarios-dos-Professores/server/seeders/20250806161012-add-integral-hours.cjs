'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('hours',[
      {
        hourStart: '07:20:00',
        hourEnd: '08:20:00',
        turnId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        hourStart: '08:20:00',
        hourEnd: '09:20:00',
        turnId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        hourStart: '09:40:00',
        hourEnd: '10:40:00',
        turnId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        hourStart: '10:40:00',
        hourEnd: '11:40:00',
        turnId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        hourStart: '13:00:00',
        hourEnd: '14:00:00',
        turnId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        hourStart: '14:00:00',
        hourEnd: '15:00:00',
        turnId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        hourStart: '15:20:00',
        hourEnd: '16:20:00',
        turnId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        hourStart: '16:20:00',
        hourEnd: '17:20:00',
        turnId: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('hours', null, {});
  }
};
