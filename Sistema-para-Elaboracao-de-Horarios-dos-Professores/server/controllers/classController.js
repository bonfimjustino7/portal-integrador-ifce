import db from '../models/index.js';
import { Op } from 'sequelize';

async function generateClassCode(academicYear, period, semester, course, type, id = null) {
    if (!Number.isInteger(Number(period))) {
        throw new Error('O período deve ser um número inteiro.');
    }

    let newCode;
    if (type) {
        newCode = `${academicYear}.${period.toString().trim()}-${course.code}-S${semester}-${type}`;
    } else {
        newCode = `${academicYear}.${period.toString().trim()}-${course.code}-S${semester}`;
    }


    const existingCode = await db.Classes.findOne({ where: { code: newCode } });

    if (!existingCode) {
        return newCode;
    }

    if (id && existingCode.id === parseInt(id)) {
        return newCode;
    }
}

const ClassController = {
    async create(req, res) {
        try {
            const { courseId, turnId, gridCourseId, calendarId, type, semester } = req.body;

            const existingCalendar = await db.Calendar.findByPk(calendarId);
            if (!existingCalendar) {
                return res.status(406).json({ error: "Não foi possível encontrar o calendário para essa turma!" });
            }

            if (semester <= 0) {
                return res.status(406).json({ error: "Informe um semestre válido!" });
            }

            const course = await db.Course.findByPk(courseId);
            if (!course) {
                return res.status(404).json({ error: 'Não foi possível encontrar o curso.' });
            }

            let turn = null;
            if (turnId) {
                turn = await db.Turn.findByPk(turnId);
                if (!turn) {
                    return res.status(404).json({ error: 'Não foi possível encontrar o turno para a turma.' });
                }
            }

            const existingClassCombination = await db.Classes.findOne({
                where: {
                    courseId: courseId,
                    semester: semester,
                    calendarId: calendarId,
                    type,
                    semester,
                    turnId: turnId === null ? { [Op.is]: null } : turnId,
                }
            });

            if (existingClassCombination) {
                return res.status(409).json({ error: 'Já existe uma turma com a mesma combinação de curso, semestre, calendário e turno.' });
            }

            let calendarNameSplited = existingCalendar.dataValues.name.split('-');
            let academicYearPeriod = calendarNameSplited[0].split('.');
            let academicYear = academicYearPeriod[0];
            let period = academicYearPeriod[1];

            let code;

            try {
                code = await generateClassCode(academicYear, period, semester, course, type);
                if (!code) {
                    throw new Error('Já existe uma turma neste calendário com este semestre e este tipo!');
                }
            }
            catch (err) {
                return res.status(406).json({ error: err.message });
            }

            const newClass = await db.Classes.create({
                code,
                semester: semester,
                courseId,
                turnId: turn ? turnId : null,
                calendarId,
                type: type || null,
                gridCourseId,
                active: true
            });

            const semesterData = await db.Semester.findOne({
                where: {
                    number: semester
                },
                include: [
                    {
                        model: db.CourseSemester,
                        as: 'courseSemesters',
                        attributes: ['semesterId'],
                        where: {
                            courseId: courseId
                        }
                    }
                ],
                attributes:['id']
            });

            await db.SemesterClass.create({
                classId: newClass.id,
                semesterId: semesterData.dataValues.id,
                planning: false
            });

            return res.status(201).json(newClass);
        } catch (error) {
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar criar a turma.', details: error.message });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { courseId, turnId, type, gridCourseId, calendarId, semester } = req.body;

            const existingClass = await db.Classes.findByPk(id);
            if (!existingClass) {
                return res.status(404).json({ error: 'Turma não encontrada.' });
            }

            const existingGrid = await db.GridCourse.findByPk(gridCourseId);
            if (!existingGrid) {
                return res.status(404).json({ error: 'Matriz curricular não encontrada.' });
            }

            const existingCalendar = await db.Calendar.findByPk(calendarId);
            if (!existingCalendar) {
                return res.status(406).json({ error: "Não foi possível encontrar o calendário para essa turma!" });
            }

            if (semester <= 0) {
                return res.status(406).json({ error: "Informe um semestre válido!" });
            }

            const course = await db.Course.findByPk(courseId);
            if (!course) {
                return res.status(404).json({ error: 'Não foi possível encontrar o curso.' });
            }

            let turn = null;
            if (turnId) {
                turn = await db.Turn.findByPk(turnId);
                if (!turn) {
                    return res.status(404).json({ error: 'Não foi possível encontrar o turno para a turma.' });
                }
            }

            const existingClassCombination = await db.Classes.findOne({
                where: {
                    courseId: courseId,
                    semester: semester,
                    calendarId: calendarId,
                    turnId: turnId === null ? { [Op.is]: null } : turnId,
                    type,
                    gridCourseId,
                    id: { [Op.ne]: id }
                }
            });

            if (existingClassCombination) {
                return res.status(409).json({ error: 'Já existe outra turma com a mesma combinação de curso, semestre, calendário e turno e tipo.' });
            }

            let calendarNameSplited = existingCalendar.dataValues.name.split('-');
            let academicYearPeriod = calendarNameSplited[0].split('.');
            let academicYear = academicYearPeriod[0];
            let period = academicYearPeriod[1];

            let newCode = existingClass.code;
            if ((existingClass.calendarId !== parseInt(calendarId)) || parseInt(semester) != existingClass.semester || type !== existingClass.type) {
                newCode = await generateClassCode(academicYear, period, semester, course, type, id);
            }

            console.log(type, newCode);

            await existingClass.update({
                code: newCode,
                semester,
                courseId,
                turnId: turn ? turnId : null,
                type,
                gridCourseId,
                calendarId
            });

            return res.status(201).json(existingClass);
        } catch (error) {
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar atualizar a turma.', details: error.message });
        }
    },

    async getAll(req, res) {
        try {
            const classes = await db.Classes.findAll({
                include: [
                    {
                        model: db.Course,
                        as: 'course',
                    },
                    {
                        model: db.Calendar,
                        as: 'calendar',
                    },
                    {
                        model: db.Turn,
                        as: 'turn',
                    },
                    {
                        model: db.GridCourse,
                        as: 'gridCourse',
                    },
                ],
                order: [
                    [{ model: db.Course, as: 'course' }, 'name', 'ASC'],
                    ['semester', 'ASC']
                ],
            });

            if (!classes.length) {
                return res.status(404).json({ error: 'Não foi possível encontrar as turmas.' });
            }

            res.status(200).json(classes);
        } catch (error) {
            res.status(500).json({ error: 'Ocorreu um erro ao tentar buscar as turmas.', details: error.message });
        }
    },

    async getActive(req, res) {
        try {
            const classes = await db.Classes.findAll({
                where: { active: true },
                order: [
                    [{ model: db.Course, as: 'course' }, 'name', 'ASC'],
                    ['semester', 'ASC']
                ],
                include: [
                    { model: db.Course, as: 'course' },
                    { model: db.Calendar, as: 'calendar' },
                    { model: db.Turn, as: 'turn' },
                    { model: db.GridCourse, as: 'gridCourse' },
                ]
            });

            if (!classes.length) {
                return res.status(404).json({ error: 'Nenhuma turma ativa encontrada.' });
            }

            res.status(200).json(classes);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar turmas ativas.', details: error.message });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const classe = await db.Classes.findByPk(id, {
                include: [
                    {
                        model: db.Course,
                        as: 'course',
                    },
                    {
                        model: db.Calendar,
                        as: 'calendar',
                    },
                    {
                        model: db.Turn,
                        as: 'turn',
                    },
                    {
                        model: db.GridCourse,
                        as: 'gridCourse',
                    },
                ],
                order: [
                    [{ model: db.Course, as: 'course' }, 'name', 'ASC'],
                    ['semester', 'ASC']
                ]
            });
            if (!classe) {
                return res.status(404).json({ error: 'Não foi possível encontrar a turma.' });
            }

            res.status(200).json(classe);
        } catch (error) {
            res.status(500).json({ error: 'Ocorreu um erro ao tentar buscar a turma.', details: error.message });
        }
    },

    async getByCoordinator(req, res) {
        try {
            const { id } = req.params;
            const classe = await db.Classes.findAll({
                include: [
                    {
                        model: db.Calendar,
                        as: 'calendar',
                    },
                    {
                        model: db.Course,
                        as: 'course',
                        include: [
                            {
                                model: db.User,
                                as: 'coordination',
                                where: { id },
                                required: true
                            }
                        ],
                        required: true
                    },
                    {
                        model: db.Turn,
                        as: 'turn',
                    },
                    {
                        model: db.GridCourse,
                        as: 'gridCourse',
                    },
                ]
            });
            if (!classe) {
                return res.status(404).json({ error: 'Não foi possível encontrar a turma.' });
            }

            res.status(200).json(classe);
        } catch (error) {
            res.status(500).json({ error: 'Ocorreu um erro ao tentar buscar a turma.', details: error.message });
        }
    },

    async getClassWithPlanning(req, res) {
        try {
            const { id } = req.params;
            const classe = await db.Classes.findAll({
                include: [
                    {
                        model: db.Calendar,
                        as: 'calendar',
                    },
                    {
                        model: db.Course,
                        as: 'course',
                        required: true,
                        include: [
                            {
                                model: db.User,
                                as: 'coordination',
                                where: { id },
                                required: true
                            },
                            {
                                model: db.Semester,
                                as: 'semesters',
                                required: true,
                                include: [
                                    {
                                        model: db.Discipline,
                                        as: 'disciplines',
                                        required: true,
                                        include: [
                                            {
                                                model: db.User,
                                                as: 'teachersPreferences',
                                                required: true,
                                                attributes: [],
                                                through: {
                                                    attributes: [],
                                                    where: {
                                                        userId: { [db.Sequelize.Op.ne]: '' }
                                                    }
                                                }
                                            }
                                        ]

                                    },
                                    {
                                        model: db.SemesterClass,
                                        as: 'semesterClasses',
                                        required: true,
                                        where: { planning: true }
                                    }
                                ],
                            }
                        ],
                    },
                    {
                        model: db.Turn,
                        as: 'turn',
                    },
                    {
                        model: db.GridCourse,
                        as: 'gridCourse',
                    },
                ],
                where: {
                    [Op.and]: db.Sequelize.literal("`course->semesters`.`number` = `Classes`.`semester`")
                },

                order: [
                    [
                        { model: db.Course, as: 'course' },
                        { model: db.Semester, as: 'semesters' },
                        'number',
                        'ASC',
                    ],
                ],
            });
            if (!classe || classe.length === 0) {
                return res.status(404).json({ error: 'Nenhum planejamento foi criado.' });
            }

            res.status(200).json(classe);
        } catch (error) {
            res.status(500).json({ error: 'Ocorreu um erro ao tentar buscar os planejamentos.', details: error.message });
        }
    },

    async deactivate(req, res) {
        try {
            const { id } = req.params;
            const classe = await db.Classes.findByPk(id);
            if (!classe) {
                return res.status(404).json({ error: 'Turma não encontrada.' });
            }
            classe.active = false;
            classe.archivedAt = new Date();
            await classe.save();
            res.status(200).json({ message: 'Turma desativada com sucesso.', classe });
        } catch (error) {
            res.status(500).json({ error: 'Erro ao desativar turma.', details: error.message });
        }
    },

    async getArchived(req, res) {
        try {
            const { id } = req.params;
            const classes = await db.Classes.findAll({
                where: { active: false },
                order: [['archivedAt', 'DESC']],
                include: [
                    { model: db.Course, as: 'course', where: { coordinationId: id } },
                    { model: db.Calendar, as: 'calendar' },
                    { model: db.Turn, as: 'turn' },
                    { model: db.GridCourse, as: 'gridCourse' },
                ]
            });
            res.status(200).json(classes);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar turmas arquivadas.', details: error.message });
        }
    },

    // NOVO: Buscar horários da turma por ano acadêmico
    async getScheduleByYear(req, res) {
        try {
            const { classId, year } = req.query;
            const classe = await db.Classes.findByPk(classId, {
                include: [
                    {
                        model: db.Schedule, // Troque para o nome correto do seu model de horários
                        as: 'schedules',
                        where: { academicYear: year }
                    }
                ]
            });
            if (!classe) {
                return res.status(404).json({ error: 'Turma não encontrada.' });
            }
            res.status(200).json(classe.schedules);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar horários.', details: error.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const classe = await db.Classes.findByPk(id);
            if (!classe) {
                return res.status(404).json({ error: 'Não foi possível encontrar a turma.' });
            }

            classe.active = false;
            await classe.save();
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Ocorreu um erro ao tentar desativar a turma.', details: error.message });
        }
    }
};

export default ClassController;
