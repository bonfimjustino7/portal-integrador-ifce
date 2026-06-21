'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const GridCourse = sequelize.define("GridCourse", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    },
    courseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'course',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
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
    tableName: 'grid-course',
    timestamps: true,
  });

  GridCourse.associate = (models) => {
    GridCourse.belongsTo(models.Course, {
      foreignKey: 'courseId',
      as: 'course',
    });

    GridCourse.belongsToMany(models.DisciplineSemester, {
      through: 'gridCourse-disciplineSemester',
      foreignKey: 'id',
      as: 'disciplinesGrid'
    });

    GridCourse.hasMany(models.Classes,{
      foreignKey: 'id',
      as: 'classes'
    });
  };

  return GridCourse;
};
