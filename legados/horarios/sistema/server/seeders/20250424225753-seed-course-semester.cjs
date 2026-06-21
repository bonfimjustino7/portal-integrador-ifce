'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const courses = await queryInterface.sequelize.query(
      `SELECT id, duration FROM courses ORDER BY createdAt;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const semesters = await queryInterface.sequelize.query(
      `SELECT id FROM semesters ORDER BY createdAt;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const courseSemester = [];

    let semesterIndex = 0;

    for (const course of courses) {
      for (let i = 0; i < course.duration; i++) {
        courseSemester.push({
          courseId: course.id,
          semesterId: semesters[semesterIndex].id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        semesterIndex++;
      }
    }

    await queryInterface.bulkInsert('course_semester', courseSemester);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('course_semester', null, {});
  }
};
