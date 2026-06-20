'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('Diretor Ensino', 'Professor', 'Coordenador', 'Admin'),
      allowNull: false,
    },
    nameCode: {
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
    tableName: 'users',
    timestamps: true,
  }
);

  User.associate = (models) => {
    User.belongsTo(models.Course, {
      foreignKey: 'id',
      as: 'coordinatorCourses',
    });

    User.belongsTo(models.Course, {
      foreignKey: 'id',
      as: 'coordinationCourses',
    });

    User.belongsTo(models.HourGrid, {
      foreignKey: 'id',
      as: 'grid',
    });

    User.belongsToMany(models.Discipline, {
      through: 'preferencesDiscipline',
      foreignKey: 'userId',
      otherKey: 'disciplineId',
      as: 'prefDisciplines',
    });

    User.belongsToMany(models.DayOfWeek, {
      through: 'preferencesDay',
      foreignKey: 'userId',
      otherKey: 'dayId', 
      as: 'prefsDays',
    });

    User.hasMany(models.PreferencesDay, {
      foreignKey: 'userId',
      as: 'daysPrefered',
    });

    User.hasMany(models.PrefsDisciplines, {
      foreignKey: 'userId',
      as: 'disciplinesPrefered',
    });
  };

  return User;
};