'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('dayOfWeek',[
      {
        name: 'Segunda',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Terça',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Quarta',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Quinta',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Sexta',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('dayOfWeek',null,{});
  }
};
