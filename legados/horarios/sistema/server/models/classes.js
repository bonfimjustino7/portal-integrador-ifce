import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Classes = sequelize.define("Classes", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    semester: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Course',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    calendarId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Calendar',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    turnId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Turn',
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
    archivedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    type:{
      type: DataTypes.STRING,
      allowNull: true
    },
    gridCourseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'GridCourse',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
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
    tableName: 'classes',
    timestamps: true,
  });

  Classes.associate = (models) => {
    Classes.belongsTo(models.Course, {
      foreignKey: 'courseId',
      as: 'course',
    });

    Classes.belongsTo(models.Calendar, {
      foreignKey: 'calendarId',
      as: 'calendar',
    });

    Classes.belongsTo(models.Turn, {
      foreignKey: 'turnId',
      as: 'turn',
    });

    Classes.belongsTo(models.GridCourse, {
      foreignKey: 'gridCourseId',
      as: 'gridCourse'
    });

    Classes.hasMany(models.SemesterClass, {
      foreignKey: 'id',
      as: 'semesterClasses'
    });

  };

  return Classes;
};