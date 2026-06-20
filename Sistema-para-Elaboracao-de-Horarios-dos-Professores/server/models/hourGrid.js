'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const HourGrid = sequelize.define("HourGrid", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: true,
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    dayId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'DayOfWeek',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    hourId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Hours',
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
      onDelete: 'CASCADE'
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Courses',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    calendarId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Calendar',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    classId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Classes',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    publicated: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: 'hour_grid',
    timestamps: true,
  });

  HourGrid.associate = (models) => {

    HourGrid.belongsTo(models.Discipline, {
      foreignKey: 'disciplineId',
      as: 'discipline'
    });

    HourGrid.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'teacher'
    });

    HourGrid.belongsTo(models.DayOfWeek, {
      foreignKey: 'dayId',
      as: 'day'
    });

    HourGrid.belongsTo(models.Hours, {
      foreignKey: 'hourId',
      as: 'hour'
    });

    HourGrid.belongsTo(models.Semester, {
      foreignKey: 'semesterId',
      as: 'semester'
    });

    HourGrid.belongsTo(models.Course, {
      foreignKey: 'courseId',
      as: 'course'
    });

    HourGrid.belongsTo(models.Calendar, {
      foreignKey: 'calendarId',
      as: 'calendar'
    });
  };

  return HourGrid;
};
