'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const DayOfWeek = sequelize.define("DayOfWeek", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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
    tableName: 'dayOfWeek',
    timestamps: true,
  });

  DayOfWeek.associate = (models) => {
    models.DayOfWeek.belongsToMany(models.User, {
      through: 'preferencesDay',
      foreignKey: 'dayId',
      otherKey: 'userId',
      as: 'usersWithPrefs', 
    });

    DayOfWeek.belongsToMany(models.Hours, {
      foreignKey: 'dayId',
      through: 'hours_days',
      as: 'hours',
    });

    DayOfWeek.hasMany(models.PreferencesDay, {
      foreignKey: 'dayId',
      as: 'daysUserPrefered',
    });
  };

  return DayOfWeek;
};
