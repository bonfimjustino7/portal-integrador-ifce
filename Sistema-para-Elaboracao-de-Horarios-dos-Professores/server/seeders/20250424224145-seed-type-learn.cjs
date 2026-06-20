'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('typeLearn', [
      {
        name: 'EJA',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Graduação',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pós-Graduação',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Técnico Concomitante',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Técnico Integrado',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Técnico Subsequente',
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('typeLearn', null, {});

  }
};
