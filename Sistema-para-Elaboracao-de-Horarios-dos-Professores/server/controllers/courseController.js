import db from '../models/index.js';
import { Op } from 'sequelize';
const CourseController = {
    async create(req, res) {
        try {
            const { name, code, duration, vacancies, typeLearnId, coordinatorId, coordinationId } = req.body;
            let existingCoordinator = null;

            const existingCourseByName = await db.Course.findOne({
                where: {
                    name: db.sequelize.where(
                        db.sequelize.fn('lower', db.sequelize.col('name')),
                        db.sequelize.fn('lower', name)
                    ),
                    typeLearnId: typeLearnId
                }
            });
            if (existingCourseByName) {
                return res.status(406).json({ error: "Já existe um curso com esse nome e este tipo de ensino." });
            }

            const existingCourseByCode = await db.Course.findOne({
                where: db.sequelize.where(
                    db.sequelize.fn('lower', db.sequelize.col('code')),
                    db.sequelize.fn('lower', code)
                ),
            });
            if (existingCourseByCode) {
                return res.status(406).json({ error: "Já existe um curso com esse código." });
            }

            if (coordinatorId) {
                existingCoordinator = await db.User.findByPk(coordinatorId);
                if (!existingCoordinator) {
                    return res.status(404).json({ error: "Não foi possível encontrar o professor para ser coordenador deste curso!" });
                }
            }

            const course = await db.Course.create({
                name,
                code: code.toUpperCase(),
                duration,
                vacancies,
                typeLearnId,
                coordinatorId: existingCoordinator ? coordinatorId : null,
                coordinationId
            });

            const semesters = []

            for (let i = 1; i <= duration; i++) {
                const semester = await db.Semester.create({
                    number: i,
                    code: course.code + '-' + 'S' + i,
                });
                semesters.push(semester);
            }

            for (const semester of semesters) {
                await db.CourseSemester.create({
                    courseId: course.id,
                    semesterId: semester.id
                });
            }

            return res.status(201).json(course);
        } catch (error) {
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar criar o curso', details: error.message });
        }
    },

    async getAll(req, res) {
        try {
            const courses = await db.Course.findAll({
                include: [
                    {
                        model: db.TypeLearn,
                        as: 'typeLearn',
                    },
                    {
                        model: db.User,
                        as: 'coordination',
                    },
                    {
                        model: db.User,
                        as: 'coordinator',
                    },
                ],
                order: [['name', 'ASC']]
            });

            if (!courses) {
                return res.status(404).json({ error: "Não foi possível encontrar os cursos!" });
            }

            return res.status(200).json(courses);
        } catch (error) {
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar buscar os cursos', details: error.message });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const course = await db.Course.findByPk(id, {
                include: [
                    {
                        model: db.TypeLearn,
                        as: 'typeLearn',
                    },
                    {
                        model: db.User,
                        as: 'coordinator',
                    },
                ],
            });

            if (!course) {
                return res.status(404).json({ error: "Não foi possível encontrar o curso!" });
            }

            res.status(200).json(course);
        } catch (error) {
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar buscar o curso', details: error.message });
        }
    },

    async getByCoordinator(req, res) {
        try {
            const { id } = req.params;
            const course = await db.Course.findOne({
                include: [
                    {
                        model: db.TypeLearn,
                        as: 'typeLearn',
                    },
                    {
                        model: db.User,
                        as: 'coordination',
                        where: { id },
                    },
                    {
                        model: db.Semester,
                        as: 'semesters',
                        through: { attributes: [] },
                        include: {
                            model: db.Discipline,
                            as: 'disciplines',
                            through: { attributes: [] },
                        }
                    },
                    {
                        model: db.Classes,
                        as: 'classes',
                        include: [
                            {
                                model: db.Turn,
                                as: 'turn',
                            },
                            {
                                model: db.Calendar,
                                as: 'calendar'
                            }
                        ]
                    }
                ],
            });

            if (!course) {
                return res.status(404).json({ error: "Não foi possível encontrar o curso!" });
            }

            return res.status(200).json(course);
        } catch (error) {
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar buscar o curso', details: error.message });
        }
    },

    async getCourseWithoutPlanning(req, res) {
        try {
            const { id } = req.params;

            const dd = await db.Semester.findAll({
                include: [
                    {
                        model: db.DisciplineSemester,
                        as: 'disciplineSemesters',
                        attributes: [],
                        required: true,
                    },
                    {
                        model: db.Course,
                        as: 'courses',
                        attributes: [],
                        through: { attributes: [] },
                        where: { coordinationId: id },
                        required: true,
                    },
                    {
                        model: db.SemesterClass,
                        as: 'semesterClasses',
                        required: true,
                        where: { planning: false }
                    }
                ],
                attributes: ['number']
            });

            let semestersNumbers = dd.map(semester => {
                return semester.number;
            });

            let course = await db.Course.findOne({
                include: [
                    {
                        model: db.User,
                        as: 'coordination',
                        where: { id },
                    },
                    {
                        model: db.Semester,
                        as: 'semesters',
                        through: { attributes: [] },
                        required: true,
                        include: [
                            {
                                model: db.Discipline,
                                as: 'disciplines',
                                required: true,
                            },
                            {
                                model: db.SemesterClass,
                                as: 'semesterClasses',
                                required: true,
                                where: { planning: false }
                            }
                        ]
                    },
                    {
                        model: db.Classes,
                        as: 'classes',
                        required: false,
                        where: {
                            semester: { [Op.in]: semestersNumbers },
                            active: true,
                        },
                        include: [
                            {
                                model: db.Turn,
                                as: 'turn',
                                required: true,
                            },
                            {
                                model: db.Calendar,
                                as: 'calendar',
                                required: true,
                            }
                        ]
                    }
                ],
            });

            return res.status(200).json(course);
        } catch (error) {
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar buscar o curso', details: error.message });
        }
    },

    async getSemesters(req, res) {
        try {
            const { courseId } = req.params;

            const existingCourse = await db.Course.findByPk(courseId);
            if (!existingCourse) {
                return res.status(404).json({ error: 'Curso não encontrado' });
            }

            const semesters = await db.CourseSemester.findAll({
                where: { courseId },
                attributes: ['semesterId'],
                order: [['semesterId', 'asc']]
            })

            if (semesters.length === 0) {
                return res.status(404).json({ error: 'Nenhum semestre encontrado para este curso' });
            }

            return res.status(200).json(semesters);
        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao procurar os semestres do curso',
                details: error.message
            });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, code, duration, typeLearnId, coordinatorId, coordinationId } = req.body;
            let existingCoordinator = null;

            if (!name || typeof name !== 'string' || name.trim() === '') {
                return res.status(400).json({ error: 'O nome do curso é obrigatório.' });
            }

            if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
                return res.status(400).json({ error: 'A duração deve ser um número válido.' });
            }

            if (!typeLearnId) {
                return res.status(400).json({ error: 'O tipo de ensino é obrigatório.' });
            }

            const existingCourse = await db.Course.findByPk(id);
            if (!existingCourse) {
                return res.status(404).json({ error: 'Curso não encontrado.' });
            }

            // const existingCourseByName = await db.Course.findOne({
            //     where: {
            //         name: db.sequelize.where(
            //             db.sequelize.fn('lower', db.sequelize.col('name')),
            //             db.sequelize.fn('lower', name)
            //         ),
            //         id: { [db.Sequelize.Op.ne]: parseInt(id) }
            //     }
            // });
            // if (existingCourseByName) {
            //     return res.status(406).json({ error: 'Já existe um curso com esse nome.' });
            // }

            const existingCode = await db.Course.findOne({
                where: { code, id: { [db.Sequelize.Op.ne]: id } },
            });

            if (existingCode) {
                return res.status(406).json({ error: 'Já existe um curso com esse código!' });
            }

            if (coordinatorId) {
                existingCoordinator = await db.User.findByPk(coordinatorId);
                if (!existingCoordinator) {
                    return res.status(404).json({ error: "Não foi possível encontrar o professor para ser coordenador deste curso!" });
                }

                await existingCourse.update({
                    name,
                    code,
                    duration,
                    typeLearnId,
                    coordinationId,
                    coordinatorId: existingCoordinator.dataValues.id
                });
            }

            return res.status(200).json(existingCourse);
        } catch (error) {
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar atualizar o curso.', details: error.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;

            const course = await db.Course.findByPk(id);
            if (!course) {
                return res.status(404).json({ error: "Curso não encontrado" });
            }

            await course.destroy();
            return res.status(204).send();
        } catch (error) {
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar excluir o curso', details: error.message });
        }
    },
}

export default CourseController;