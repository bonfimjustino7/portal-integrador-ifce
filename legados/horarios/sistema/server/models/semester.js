'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Semester = sequelize.define("Semester", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'semesters',
    timestamps: true,
  });

  Semester.associate = (models) => {
    Semester.belongsToMany(models.Course, {
      foreignKey: 'semesterId',
      through: 'course_semester',
      as: 'courses',
    });

    Semester.belongsToMany(models.Discipline, {
      foreignKey: 'semesterId',
      through: 'discipline_semester',
      as: 'disciplines',
    });

    Semester.hasMany(models.DisciplineSemester, {
      foreignKey: 'semesterId',
      as: 'disciplineSemesters'
    });

    Semester.hasMany(models.HourGrid, {
      foreignKey: 'semesterId',
      as: 'grid',
    });

    Semester.hasMany(models.SemesterClass, {
      foreignKey: 'semesterId',
      as: 'semesterClasses'
    });
    
    Semester.hasMany(models.CourseSemester, {
      foreignKey: 'semesterId',
      as: 'courseSemesters',
    });
  };

  return Semester;
};
