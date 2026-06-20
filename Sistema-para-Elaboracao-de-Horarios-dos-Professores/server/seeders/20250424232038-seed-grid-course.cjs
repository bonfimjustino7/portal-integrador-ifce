'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const courses = await queryInterface.sequelize.query(
      'SELECT * FROM courses',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const gridCourses = courses.map((course, index) => ({
      id: index + 1,
      name: `Matriz Curricular - ${course.name}`,
      courseId: course.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await queryInterface.bulkInsert('grid-course', gridCourses);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('classes', null, {});
    console.log('Turmas removidas com sucesso.');
  }
};
