'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const SemesterClass = sequelize.define("SemesterClass", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        classId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'Classes',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
        },
        planning: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        semesterId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Semester',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
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
            onUpdate: DataTypes.NOW
        }
    }, {
        tableName: 'semester_class',
        timestamps: true,
    });

    SemesterClass.associate = (models) => {
        SemesterClass.hasMany(models.Classes, {
            foreignKey: 'id',
            as: 'classes',
        });

        SemesterClass.hasMany(models.Semester, {
            foreignKey: 'id',
            as: 'semesters',
        });
    };

    return SemesterClass;
};
