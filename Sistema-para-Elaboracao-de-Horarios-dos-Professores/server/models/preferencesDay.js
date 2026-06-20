'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const PreferencesDay = sequelize.define("PreferencesDay", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    dayId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'DayOfWeek',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    observation:{
        type: DataTypes.TEXT,
        allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    }
  }, {
    tableName: 'preferencesDay',
    timestamps: true,
  });

  PreferencesDay.associate = (models) => {
    PreferencesDay.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'usersWithPrefs', 
    });

    PreferencesDay.belongsTo(models.DayOfWeek, {
      foreignKey: 'dayId',
      as: 'days',
    });
  };

  return PreferencesDay;
};
