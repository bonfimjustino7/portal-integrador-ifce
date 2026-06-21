'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('classes','gridCourseId',{
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'grid-course',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('classes', 'gridCourseId');
  }
};
