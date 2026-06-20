'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const PrefsDisciplines = sequelize.define("PrefsDisciplines", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    disciplineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Disciplines',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
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
    tableName: 'preferencesDiscipline',
    timestamps: true,
  });

  PrefsDisciplines.associate = (models) => {
    PrefsDisciplines.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'usersWithPrefs', 
    });

    PrefsDisciplines.belongsTo(models.Discipline, {
      foreignKey: 'disciplineId',
      as: 'disciplines',
    });
  };

  return PrefsDisciplines;
};
