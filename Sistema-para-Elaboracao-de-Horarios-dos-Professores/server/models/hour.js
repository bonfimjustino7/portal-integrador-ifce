'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Hours = sequelize.define("Hours", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    hourStart: {
      type: DataTypes.TIME,
      allowNull: false
    },
    hourEnd: {
      type: DataTypes.TIME,
      allowNull: false
    },
    turnId:{
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Turns',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
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
    tableName: 'hours',
    timestamps: true,
  });

  Hours.associate = (models) => {
    Hours.belongsToMany(models.DayOfWeek, {
      foreignKey: 'hourId',
      through: 'hours_days',
      as: 'days',
    });

    Hours.hasMany(models.HourGrid, {
      foreignKey: 'hourId',
      as: 'grid',
    });

    Hours.belongsTo(models.Turn, {
      foreignKey: 'turnId',
      as: 'turn',
    });
  };

  return Hours;
};
