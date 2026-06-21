'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('turns',[
      {
        name: 'Matutino',
        code: 'MT',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Vespertino',
        code: 'VP',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Noturno',
        code: 'NT',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Integral',
        code: 'IT',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('turns', null, {});
  }
};
