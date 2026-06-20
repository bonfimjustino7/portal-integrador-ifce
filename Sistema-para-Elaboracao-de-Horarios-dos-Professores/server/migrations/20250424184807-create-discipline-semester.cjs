'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('discipline_semester', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      disciplineId: {
        type: Sequelize.INTEGER,
        references: { model: 'disciplines', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      semesterId: {
        type: Sequelize.INTEGER,
        references: { model: 'semesters', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      courseId:{
        type: Sequelize.INTEGER,
        references: { model: 'courses', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        allowNull: false
      },
      type:{
        type: Sequelize.ENUM('Obrigatória', 'Optativa','PEI'),
        allowNull: false
      },
      createdAt: { 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.NOW,
        allowNull: false,
      },
      updatedAt: { 
        type: Sequelize.DATE, 
        defaultValue: Sequelize.NOW,
        allowNull: false,
        onUpdate: Sequelize.NOW
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('discipline_semester')
  }
};
