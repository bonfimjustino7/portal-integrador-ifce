'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const courses = await queryInterface.sequelize.query(
      'SELECT id FROM courses order by id asc',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    console.log(courses);

  
    const t = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkInsert('classes', [
        {
          id: uuidv4(),
          code: '2025.1 - IET - S2',
          semester: 2,
          courseId: courses[7].id,
          calendarId: 1,
          turnId: 4,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[7].id
        },
        {
          id: uuidv4(),
          code: '2024.1 - IET - S4',
          semester: 4,
          courseId: courses[7].id,
          calendarId: 1,
          turnId: 4,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[7].id
        },
        {
          id: uuidv4(),
          code: '2023.1 - IET - S6',
          semester: 6,
          courseId: courses[7].id,
          calendarId: 1,
          turnId: 4,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[7].id
        },
        {
          id: uuidv4(),
          code: '2025.1 - IIF - S2',
          semester: 2,
          courseId: courses[10].id,
          calendarId: 1,
          turnId: 4,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[10].id
        },
        {
          id: uuidv4(),
          code: '2024.1 - IIF - S4',
          semester: 4,
          courseId: courses[10].id,
          calendarId: 1,
          turnId: 4,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[10].id
        },
        {
          id: uuidv4(),
          code: '2023.1 - IIF - S6.A',
          semester: 6,
          courseId: courses[10].id,
          calendarId: 1,
          turnId: 4,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[10].id
        },
        {
          id: uuidv4(),
          code: '2023.1 - IIF - S6.B',
          semester: 6,
          courseId: courses[10].id,
          calendarId: 1,
          turnId: 4,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[10].id
        },
        {
          id: uuidv4(),
          code: '2025.1 - IMI - S2',
          semester: 2,
          courseId: courses[11].id,
          calendarId: 1,
          turnId: 4,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[11].id
        },
        {
          id: uuidv4(),
          code: '2024.1 - IMI - S4',
          semester: 4,
          courseId: courses[11].id,
          calendarId: 1,
          turnId: 4,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[11].id
        },
        {
          id: uuidv4(),
          code: '2023.1 - IMI - S6',
          semester: 6,
          courseId: courses[11].id,
          calendarId: 1,
          turnId: 4,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[11].id
        },
        {
          id: uuidv4(),
          code: '2025.2 - BEM - S1',
          semester: 1,
          courseId: courses[2].id,
          calendarId: 1,
          turnId: 1,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[2].id
        },
        {
          id: uuidv4(),
          code: '2025.2 - BEM - S3',
          semester: 3,
          courseId: courses[2].id,
          calendarId: 1,
          turnId: 1,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[2].id
        },
        {
          id: uuidv4(),
          code: '2025.1 - LMT - S2',
          semester: 2,
          courseId: courses[5].id,
          calendarId: 1,
          turnId: 1,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[5].id
        },
        {
          id: uuidv4(),
          code: '2025.1 - BEE - S2',
          semester: 2,
          courseId: courses[1].id,
          calendarId: 1,
          turnId: 1,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[1].id
        },
        {
          id: uuidv4(),
          code: '2024.1 - CMI - S4',
          semester: 4,
          courseId: courses[12].id,
          calendarId: 1,
          turnId: 2,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[12].id
        },
        {
          id: uuidv4(),
          code: '2024.2 - CMI - S3',
          semester: 3,
          courseId: courses[12].id,
          calendarId: 1,
          turnId: 2,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[12].id
        },
        {
          id: uuidv4(),
          code: '2024.1 - SMI - S4',
          semester: 4,
          courseId: courses[13].id,
          calendarId: 1,
          turnId: 2,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[13].id
        },
        {
          id: uuidv4(),
          code: '2024.2 - CET - S3',
          semester: 3,
          courseId: courses[8].id,
          calendarId: 1,
          turnId: 2,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[8].id
        },
        {
          id: uuidv4(),
          code: '2024.1 - CET - S4',
          semester: 4,
          courseId: courses[8].id,
          calendarId: 1,
          turnId: 2,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[8].id
        },
        {
          id: uuidv4(),
          code: '2025.1 - LFS - S2',
          semester: 2,
          courseId: courses[6].id,
          calendarId: 1,
          turnId: 2,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[6].id
        },
        {
          id: uuidv4(),
          code: '2025.1 - SAD - S1',
          semester: 1,
          courseId: courses[14].id,
          calendarId: 1,
          turnId: 3,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[14].id
        },
        {
          id: uuidv4(),
          code: '2024.2 - SAD - S2',
          semester: 2,
          courseId: courses[14].id,
          calendarId: 1,
          turnId: 3,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[14].id
        },
        {
          id: uuidv4(),
          code: '2024.2 - EJA - S2',
          semester: 2,
          courseId: courses[15].id,
          calendarId: 1,
          turnId: 3,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[15].id
        },
        {
          id: uuidv4(),
          code: '2023.2 - EJA - S4',
          semester: 4,
          courseId: courses[15].id,
          calendarId: 1,
          turnId: 3,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[15].id
        },
        {
          id: uuidv4(),
          code: '2025.2 - LFS - S1',
          semester: 1,
          courseId: courses[6].id,
          calendarId: 1,
          turnId: 3,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[6].id
        },
        {
          id: uuidv4(),
          code: '2024.2 - LFS - S3',
          semester: 3,
          courseId: courses[6].id,
          calendarId: 1,
          turnId: 3,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[6].id
        },
        {
          id: uuidv4(),
          code: '2025.2 - BSI - S1',
          semester: 1,
          courseId: courses[0].id,
          calendarId: 1,
          turnId: 3,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[0].id
        },
        {
          id: uuidv4(),
          code: '2025.1 - TMI - S2',
          semester: 2,
          courseId: courses[3].id,
          calendarId: 1,
          turnId: 3,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[3].id
        },
        {
          id: uuidv4(),
          code: '2025.2 - LMT - S1',
          semester: 1,
          courseId: courses[5].id,
          calendarId: 1,
          turnId: 3,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[5].id
        },
        {
          id: uuidv4(),
          code: '2024.2 - LMT - S3',
          semester: 3,
          courseId: courses[5].id,
          calendarId: 1,
          turnId: 3,
          active: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          gridCourseId: courses[5].id
        },
      ], { transaction: t });
      await t.commit();
    } catch (error) {
      console.log(error.stack);
      await t.rollback();
      throw error;
    }

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('classes', null, {});
    console.log('Turmas removidas com sucesso.');
  }
};