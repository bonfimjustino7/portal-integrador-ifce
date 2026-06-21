'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('classes',{
      id:{
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      code:{
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      semester:{
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      courseId:{
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'courses',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      calendarId:{
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'calendar',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      turnId:{
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'turns',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      active: { 
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
    await queryInterface.dropTable('classes');
  }
};