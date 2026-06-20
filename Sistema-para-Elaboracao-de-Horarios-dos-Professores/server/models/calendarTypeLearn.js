'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const CalendarTypeLearn = sequelize.define("CalendarTypeLearn", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    typeLearnId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'typeLearn',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    calendarId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Calendar',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      onUpdate: DataTypes.NOW
    },
  }, {
    tableName: 'calendar_type_learn',
    timestamps: true,
  });

  CalendarTypeLearn.associate = (models) => {
    CalendarTypeLearn.belongsTo(models.Calendar, {
      foreignKey: 'calendarId',
      as: 'calendars',
    });

    CalendarTypeLearn.belongsTo(models.TypeLearn, {
      foreignKey: 'typeLearnId',
      as: 'typeLearns',
    });

  };

  return CalendarTypeLearn;
};
