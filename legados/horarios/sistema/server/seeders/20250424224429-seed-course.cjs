'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM users ORDER BY id ASC;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    await queryInterface.bulkInsert('courses', [
      {
        name: 'Bacharelado em Sistemas de Informação',
        duration: 8,
        code: 'BSI',
        typeLearnId: 2,
        coordinatorId: users[62].id,
        coordinationId: users[2].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Bacharelado em Engenharia Elétrica',
        duration: 10,
        code: 'BEE',
        typeLearnId: 2,
        coordinatorId: users[31].id,
        coordinationId: users[3].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Bacharelado em Engenharia Mecânica',
        duration: 10,
        code: 'BEM',
        typeLearnId: 2,
        coordinatorId: users[36].id,
        coordinationId: users[4].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Tecnologia em Mecatrônica Industrial',
        duration: 7,
        code: 'TMI',
        typeLearnId: 2,
        coordinatorId: users[56].id,
        coordinationId: users[5].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Especialização em Docência do Ensino Superior',
        duration: 3,
        code: 'PDES',
        typeLearnId: 3,
        coordinatorId: users[6].id,
        coordinationId: users[6].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Licenciatura em Matemática',
        duration: 8,
        code: 'LMT',
        typeLearnId: 2,
        coordinatorId: users[24].id,
        coordinationId: users[7].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Licenciatura em Física',
        duration: 8,
        code: 'LFS',
        typeLearnId: 2,
        coordinatorId: users[53].id,
        coordinationId: users[8].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Eletrotécnica',
        duration: 6,
        code: 'IET',
        typeLearnId: 5,
        coordinatorId: users[52].id,
        coordinationId: users[9].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Eletrotécnica',
        duration: 6,
        code: 'CET',
        typeLearnId: 4,
        coordinatorId: users[52].id,
        coordinationId: users[10].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Eletrotécnica',
        duration: 6,
        code: 'SET',
        typeLearnId: 6,
        coordinatorId: users[52].id,
        coordinationId: users[11].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Informática',
        duration: 6,
        code: 'IIF',
        typeLearnId: 5,
        coordinatorId: users[21].id,
        coordinationId: users[12].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Mecânica Industrial',
        duration: 6,
        code: 'IMI',
        typeLearnId: 5,
        coordinatorId: users[61].id,
        coordinationId: users[13].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Mecânica Industrial',
        duration: 6,
        code: 'CMI',
        typeLearnId: 4,
        coordinatorId: users[61].id,
        coordinationId: users[14].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Mecânica Industrial',
        duration: 6,
        code: 'SMI',
        typeLearnId: 6,
        coordinatorId: users[61].id,
        coordinationId: users[15].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Administração',
        duration: 2,
        code: 'SAD',
        typeLearnId: 6,
        coordinatorId: users[16].id,
        coordinationId: users[16].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Educação para Jovens Adultos',
        duration: 6,
        code: 'EJA',
        typeLearnId: 1,
        coordinatorId: users[17].id,
        coordinationId: users[17].id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('courses', null, {});
  }
};