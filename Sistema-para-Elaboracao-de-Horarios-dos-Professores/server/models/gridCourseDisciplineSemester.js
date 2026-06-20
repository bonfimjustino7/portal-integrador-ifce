'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const CourseGridSemester = sequelize.define("CourseGridSemester", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    gridCourseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'GridCourse',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    disciplineSemesterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'DisciplineSemester',
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
    tableName: 'gridCourse-disciplineSemester',
    timestamps: true,
  });

  CourseGridSemester.associate = (models) => {
    CourseGridSemester.hasMany(models.GridCourse, {
      foreignKey: 'id',
      as: 'grids',
    });

    CourseGridSemester.hasMany(models.DisciplineSemester, {
      foreignKey: 'id',
      as: 'disciplineSemesters'
    });

  };

  return CourseGridSemester;
};