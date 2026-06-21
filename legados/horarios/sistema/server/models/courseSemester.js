'use strict';

import { DataTypes } from 'sequelize';

export default (sequelize) => {
    const CourseSemester = sequelize.define("CourseSemester", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        courseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Course',
                key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
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
        tableName: 'course_semester',
        timestamps: true,
    });

    CourseSemester.associate = (models) => {
        CourseSemester.belongsTo(models.Course, {
            foreignKey: 'courseId',
            as: 'course',
        });

        CourseSemester.belongsTo(models.Semester, {
            foreignKey: 'semesterId',
            as: 'semester',
        });
    };

    return CourseSemester;
};
