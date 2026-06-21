'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Course = sequelize.define("Course", {
     id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    typeLearnId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    coordinationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    coordinatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
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
    tableName: 'courses',
    timestamps: true,
  });

  Course.associate = (models) => {
    Course.belongsTo(models.TypeLearn, {
      foreignKey: 'typeLearnId',
      as: 'typeLearn',
    });

    Course.belongsTo(models.User, {
      foreignKey: 'coordinationId',
      as: 'coordination',
    });

    Course.belongsTo(models.User, {
      foreignKey: 'coordinatorId',
      as: 'coordinator',
    });

    Course.belongsToMany(models.Semester, {
      foreignKey: 'courseId',
      through: 'course_semester',
      as: 'semesters',
    });

    Course.hasMany(models.Classes, {
      foreignKey: 'courseId',
      as: 'classes',
    });

    Course.hasMany(models.HourGrid, {
      foreignKey: 'courseId',
      as: 'grid',
    });

    Course.hasMany(models.GridCourse, {
      foreignKey: 'courseId',
      as: 'gridCourse',
    });

    Course.hasMany(models.CourseSemester,{
      foreignKey: 'courseId',
      as: 'courseSemesters',
    });
  };

  return Course;
};