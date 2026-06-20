'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('semesters', {
      id:   { type:Sequelize.INTEGER, autoIncrement: true, allowNull: false, primaryKey:true },
      code: { type:Sequelize.STRING, allowNull:false }, 
      number: { type:Sequelize.INTEGER, allowNull:false },
      createdAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, defaultValue: Sequelize.NOW, onUpdate: Sequelize.NOW }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('semesters');
  }
};
