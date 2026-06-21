'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const Turn = sequelize.define("Turn", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
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
        tableName: 'turns',
        timestamps: true,
    });

    Turn.associate = (models) => {
        Turn.belongsToMany(models.Classes, {
            foreignKey: 'turnId',
            through: 'classes_turn',
            as: 'classes',
        });

        Turn.hasMany(models.Hours, {
            foreignKey: 'turnId',
            as: 'hours',
        });
    };

    return Turn;
};
