'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('disciplines',{
      id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
      },
      name:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      code:{
        type: Sequelize.STRING,
        allowNull: false,
      },
      workload:{
        type: Sequelize.INTEGER,
        allowNull: false
      },
      credit:{
        type: Sequelize.INTEGER,
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

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('disciplines');
  }
};
