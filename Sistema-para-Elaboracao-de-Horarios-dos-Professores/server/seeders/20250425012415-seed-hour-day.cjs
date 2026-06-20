'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hours = await queryInterface.sequelize.query(
      `SELECT id FROM hours;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const days = await queryInterface.sequelize.query(
      `SELECT id FROM dayOfWeek;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const hourDays = [];

    for (const day of days) {
      for (const hour of hours) {
        hourDays.push({
          hourId: hour.id,
          dayId: day.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    await queryInterface.bulkInsert('hour_day', hourDays);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('hour_day', null, {});
  }
};
