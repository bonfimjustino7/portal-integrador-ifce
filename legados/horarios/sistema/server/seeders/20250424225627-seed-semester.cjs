'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const courses = await queryInterface.sequelize.query(
      `SELECT id, name, duration, code FROM courses ORDER BY createdAt;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const semesters = [];
    for (let i = 0; i <= courses.length; i++) {
      if (courses[i] === undefined) break;
      for (let j = 1; j <= courses[i].duration; j++) {
        semesters.push({
          code: `${courses[i].code}-S${j}`,
          number: j,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    if (semesters.length > 0) {
      await queryInterface.bulkInsert('semesters', semesters);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('semesters', null, {});
  }
};