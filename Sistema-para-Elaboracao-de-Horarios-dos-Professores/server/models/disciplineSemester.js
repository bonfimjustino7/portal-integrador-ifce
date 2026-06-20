'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const DisciplineSemester = sequelize.define("DisciplineSemester", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true
    },
    disciplineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Disciplines',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    semesterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Semesters',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Courses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    type: {
      type: DataTypes.ENUM('Obrigatória', 'Optativa', 'PEI'),
      allowNull: true,
      defaultValue: 'Obrigatória',
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
    tableName: 'discipline_semester',
    timestamps: true,
  });

  DisciplineSemester.associate = (models) => {
    DisciplineSemester.belongsTo(models.Discipline, {
      foreignKey: 'disciplineId', 
      as: 'disciplines', 
    });

    DisciplineSemester.belongsTo(models.Semester, {
      foreignKey: 'semesterId', 
      as: 'semesters', 
    });

    DisciplineSemester.belongsTo(models.Course, {
      foreignKey: 'courseId', 
      as: 'course', 
    });

    DisciplineSemester.belongsToMany(models.GridCourse, {
      through: 'gridCourse-disciplineSemester',
      foreignKey: 'id',
      as: 'gridCourse'
    });

    DisciplineSemester.hasMany(models.CourseGridSemester, {
      foreignKey: 'disciplineSemesterId',
      as: 'courseGridSemesters'
    });
  };

  return DisciplineSemester;
};
