'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const TypeLearn = sequelize.define("TypeLearn", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },{
    tableName: 'typeLearn',
    timestamps: true,
  });

  TypeLearn.associate = (models) => {
    TypeLearn.hasMany(models.Course,{
      foreignKey: 'typeLearnId',
      as: 'courses'
    });

    TypeLearn.belongsToMany(models.Calendar,{
      foreignKey: 'typeLearnId',
      through: 'calendar_type_learn',
      as: 'calendars'
    });
  };

  return TypeLearn;
};
