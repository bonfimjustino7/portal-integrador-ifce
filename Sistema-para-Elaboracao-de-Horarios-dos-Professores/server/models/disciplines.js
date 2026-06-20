'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Discipline = sequelize.define("Discipline", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    workload: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    credit: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    }
  }, {
    tableName: 'disciplines',
    timestamps: true,
  });

  Discipline.associate = (models) => {
    Discipline.hasMany(models.DisciplineSemester, {
      foreignKey: 'disciplineId',
      as: 'disciplineSemesters',
    });

    Discipline.belongsToMany(models.User, {
      foreignKey: 'disciplineId',
      through: 'preferencesDiscipline',
      as: 'teachersPreferences',
    });

    Discipline.belongsToMany(models.Semester, {
      through: 'discipline_semester',
      foreignKey: 'disciplineId',
      as: 'semesters',
    });

    Discipline.hasMany(models.PrefsDisciplines, {
      foreignKey: 'disciplineId',
      as: 'preferences',
    });

    Discipline.hasMany(models.HourGrid, {
      foreignKey: 'disciplineId',
      as: 'hourGrids',
    });
  };

  return Discipline;
};
