'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const courses = await queryInterface.sequelize.query(
      'SELECT * FROM courses',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    courses.forEach(async (course, index) => {
      await queryInterface.bulkInsert('grid-course', [
        {
          id: index + 1,
          name: `Matriz Curricular - ${course.name}`,
          courseId: course.id,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('classes', null, {});
    console.log('Turmas removidas com sucesso.');
  }
};