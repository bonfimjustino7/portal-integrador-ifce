'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('turns',{
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
      },
      name:{
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      code:{
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
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
    await queryInterface.dropTable('turns');
  }
};
