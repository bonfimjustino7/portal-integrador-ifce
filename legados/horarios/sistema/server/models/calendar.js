'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const Calendar = sequelize.define("Calendar", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        dateStart: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        dateEnd: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        dateClose: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false
        },
        period: {
            type: DataTypes.TINYINT,
            allowNull: false
        },
        active: {
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
            allowNull: false,
            onUpdate: DataTypes.NOW
        },
    }, {
        tableName: 'calendar',
        timestamps: true,
    });

    Calendar.associate = (models) => {
        Calendar.hasMany(models.Classes, {
            foreignKey: 'calendarId',
            as: 'classes',
        });

        Calendar.hasMany(models.HourGrid, {
            foreignKey: 'calendarId',
            as: 'hourGrids',
        });

        Calendar.belongsToMany(models.TypeLearn, {
            foreignKey: 'calendarId',
            through: 'calendar_type_learn',
            as: 'typeLearn'
        });
    };

    return Calendar;
};
