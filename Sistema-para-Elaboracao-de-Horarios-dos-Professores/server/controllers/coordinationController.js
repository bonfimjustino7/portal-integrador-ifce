import db from '../models/index.js';
import { Op, where } from 'sequelize';
const CoordinationController = {
    async createPlanning(req, res) {
        try {
            const { classId } = req.params;

            if (!classId) {
                return res.status(400).json({ error: 'Dados inválidos: classId é obrigatório!' });
            }

            const existingClass = await db.Classes.findByPk(classId);
            if (!existingClass) {
                return res.status(404).json({ error: 'Turma não encontrada!' });
            }

            const existingSemester = await db.Semester.findOne({
                include: [
                    {
                        model: db.Course,
                        as: 'courses',
                        where: { id: existingClass.courseId },
                        through: { attributes: [] }
                    }
                ],
                where: { number: existingClass.semester }
            });

            if (!existingSemester) {
                return res.status(404).json({ error: 'Semestre não encontrado para esta turma!' });
            }

            await db.sequelize.transaction(async (transaction) => {
                await db.SemesterClass.update(
                    { planning: true },
                    {
                        where: {
                            classId,
                            semesterId: existingSemester.id
                        },
                        transaction
                    }
                );
            });

            return res.status(201).json({
                message: 'Planejamento criado com sucesso!'
            });
        } catch (error) {
            console.error('Erro ao criar planejamento:', error);
            return res.status(500).json({ error: 'Erro ao criar o planejamento docente para esta turma!', details: error.message });
        }
    },

    async getPlanningByClassId(req, res) {
        try {
            const { classId } = req.params;
            const classe = await db.Classes.findByPk(classId);

            const existingSemester = await db.Semester.findOne({
                include: [
                    {
                        model: db.Course,
                        as: 'courses',
                        where: { id: classe.courseId },
                        through: { attributes: [] }
                    }
                ],
                where: { number: classe.dataValues.semester }
            });

            const existingClass = await db.Classes.findByPk(classId, {
                include: [
                    {
                        model: db.Course,
                        as: 'course',
                        attributes: ['id', 'name'],
                        required: true,
                        include: [
                            {
                                model: db.Semester,
                                as: 'semesters',
                                where: { number: classe.dataValues.semester },
                                required: true,
                                through: { attributes: [], },
                                attributes: ['id', 'number'],
                                include: [
                                    {
                                        model: db.Discipline,
                                        as: 'disciplines',
                                        attributes: ['id', 'name'],
                                        through: {
                                            attributes: [],
                                        },
                                        include: [
                                            {
                                                model: db.User,
                                                attributes: ['id', 'name'],
                                                as: 'teachersPreferences',
                                                required: true,
                                                through: {
                                                    attributes: [],
                                                    where: { semesterId: existingSemester.id }
                                                },
                                                include: [
                                                    {
                                                        model: db.DayOfWeek,
                                                        as: 'prefsDays',
                                                        required: false,
                                                        attributes: ['id', 'name'],
                                                        through: { attributes: [], },
                                                    }
                                                ],
                                            }
                                        ]
                                    },
                                    {
                                        model: db.SemesterClass,
                                        as: 'semesterClasses',
                                        required: true,
                                        where: { planning: true }
                                    }
                                ]
                            }
                        ],
                    },
                    {
                        model: db.Calendar,
                        as: 'calendar',
                        attributes: ['name']
                    },
                    {
                        model: db.Turn,
                        as: 'turn',
                        attributes: ['id', 'name']
                    }
                ]
            });

            if (!existingClass) {
                return res.status(404).json({ error: 'Planejamento não encontrado para esta turma!' });
            }

            let academicYear = new Date().getFullYear().toString();
            let period = '';
            if (existingClass.calendar?.name) {
                const [year, per] = existingClass.calendar.name.split('-')[0].trim().split('.');
                academicYear = year || academicYear;
                period = per || '';
            }

            const subjects = [];
            const professorMap = new Map();

            const semester = existingClass.course?.semesters?.[0];
            if (semester) {
                semester.disciplines.forEach(discipline => {
                    const subjectId = discipline.id;

                    let existingSubject = subjects.find(sub => sub.subjectId === subjectId);
                    if (!existingSubject) {
                        existingSubject = { subjectId, professorIds: [] };
                        subjects.push(existingSubject);
                    }

                    discipline.teachersPreferences.forEach(teacher => {
                        const teacherId = teacher.id;
                        const teacherName = teacher.name;

                        if (!existingSubject.professorIds.includes(teacherId)) {
                            existingSubject.professorIds.push(teacherId);
                        }

                        if (!professorMap.has(teacherId)) {
                            professorMap.set(teacherId, {
                                professorId: teacherId,
                                professorName: teacherName,
                                prefDays: teacher.prefsDays?.map(day => ({
                                    id: day.id,
                                    name: day.name
                                })) || []
                            });
                        }
                    });
                });
            } else {
                console.warn('Nenhum semestre encontrado para a turma:', classId);
            }


            const professorPreferences = Array.from(professorMap.values());

            const response = {
                classId: existingClass.id,
                academicYear,
                period,
                turnId: existingClass.turn?.id || '',
                course: {
                    id: existingClass.course?.id || '',
                    name: existingClass.course?.name || ''
                },
                subjects,
                professorPreferences
            };

            return res.status(200).json(response);
        } catch (error) {
            console.error('Erro ao buscar planejamento:', error);
            return res.status(500).json({ error: 'Erro ao buscar o planejamento docente para esta turma!', details: error.message });
        }
    },

    async getAllPlanning(req, res) {
        try {
            const calendarId = req.params.calendarId;
            if (!calendarId) {
                return res.status(400).json({ error: 'O ID do calendário é obrigatório.' });
            }
            const parsedCalendarId = parseInt(calendarId, 10);
            if (isNaN(parsedCalendarId)) {
                return res.status(400).json({ error: 'O ID do calendário deve ser um número válido.' });
            }

            const existingClasses = await db.Classes.findAll({
                include: [
                    {
                        model: db.Course,
                        as: 'course',
                        attributes: ['id', 'name'],
                        required: true,
                        include: [
                            {
                                model: db.Semester,
                                as: 'semesters',
                                where: { number: [db.Sequelize.col('Classes.semester')] },
                                required: true,
                                through: { attributes: [] },
                                attributes: ['id', 'number'],
                                include: [
                                    {
                                        model: db.Discipline,
                                        as: 'disciplines',
                                        attributes: ['id', 'name'],
                                        include: [
                                            {
                                                model: db.User,
                                                attributes: ['id', 'name'],
                                                as: 'teachersPreferences',
                                                required: true,
                                                through: {
                                                    attributes: ['semesterId','userId','disciplineId'],
                                                },
                                                include: [
                                                    {
                                                        model: db.DayOfWeek,
                                                        as: 'prefsDays',
                                                        required: true,
                                                        attributes: ['id', 'name'],
                                                        through: { attributes: ['observation'] },
                                                        order: [['id', 'ASC']]
                                                    }
                                                ],
                                            }
                                        ]
                                    },
                                    {
                                        model: db.SemesterClass,
                                        as: 'semesterClasses',
                                        where: { planning: true },
                                        attributes: [],
                                        required: true,
                                    }
                                ],
                            }
                        ],
                    },
                    {
                        model: db.Calendar,
                        as: 'calendar',
                        attributes: ['name'],
                        where: {
                            id: parsedCalendarId
                        },
                        required: true
                    },
                    {
                        model: db.Turn,
                        as: 'turn',
                        attributes: ['id', 'name']
                    }
                ],
                order: [
                    [{ model: db.Course, as: 'course' }, 'name', 'ASC'],
                    [
                        { model: db.Course, as: 'course' },
                        { model: db.Semester, as: 'semesters' },
                        'number',
                        'ASC',
                    ],
                ],
            });

            if (!existingClasses || existingClasses.length === 0) {
                return res.status(404).json({ error: 'Planejamento não encontrado para as turmas com o ID de calendário fornecido.' });
            }

            const coursesMap = new Map();

            existingClasses.forEach(cls => {
                const courseId = cls.course?.id;
                if (!courseId) return;

                if (!coursesMap.has(courseId)) {
                    coursesMap.set(courseId, {
                        course: {
                            id: cls.course.id,
                            name: cls.course.name,
                            semesters: new Map()
                        }
                    });
                }

                const courseData = coursesMap.get(courseId);
                const semesters = cls.course?.semesters || [];

                semesters.forEach(semester => {
                    const semesterId = semester.id;
                    if (cls.semester !== semester.number) {
                        return;
                    }

                    if (!courseData.course.semesters.has(semesterId)) {
                        courseData.course.semesters.set(semesterId, {
                            id: semester.id,
                            number: semester.number,
                            disciplines: [],
                            classes: []
                        });
                    }

                    const semesterData = courseData.course.semesters.get(semesterId);

                    const disciplines = semester.disciplines
                        .filter(discipline => discipline.teachersPreferences?.length > 0)
                        .map(discipline => {
                            const filteredTeachers = (discipline.teachersPreferences || []).filter(teacher =>
                                teacher.preferencesDiscipline?.dataValues?.semesterId === semesterId
                            );

                        if (filteredTeachers.length === 0) return null;

                        return {
                            id: discipline.id,
                            name: discipline.name,
                            teachersPreferences: filteredTeachers.map(teacher => ({
                                id: teacher.id,
                                name: teacher.name,
                                prefsDays: teacher.prefsDays
                                    ?.map(day => ({
                                        id: day.id,
                                        name: day.name,
                                        observation: day.preferencesDay?.observation || ''
                                    }))
                                    .sort((a, b) => a.id - b.id)
                                    || []
                            }))
                        };
                    })
                    .filter(Boolean);

                    disciplines.forEach(disc => {
                        if (!semesterData.disciplines.some(existingDisc => existingDisc.id === disc.id)) {
                            semesterData.disciplines.push(disc);
                        }
                    });

                    if (disciplines.length > 0) {
                        semesterData.classes.push({
                            id: cls.id,
                            code: cls.code.split('-')[1] + '-' + cls.code.split('-')[2],
                            year: cls.code.split('-')[0],
                            turn: cls.turn || null
                        });
                    }
                });
            });

            const response = Array.from(coursesMap.values())
                .map(courseData => ({
                    course: {
                        id: courseData.course.id,
                        name: courseData.course.name,
                        semesters: Array.from(courseData.course.semesters.values())
                            .filter(semester => semester.disciplines.length > 0)
                            .sort((a, b) => a.number - b.number)
                    }
                }))
                .filter(item => item.course.semesters.length > 0);

            return res.status(200).json(response);
        } catch (error) {
            console.error('Erro ao buscar planejamento:', error);
            return res.status(500).json({ error: 'Erro ao buscar o planejamento docente para esta turma!', details: error.message });
        }
    },

    async updatePlanning(req, res) {
        try {
            const { classId, associationTeacherData = [] } = req.body;

            if (!classId || !Array.isArray(associationTeacherData) || associationTeacherData.length === 0) {
                return res.status(400).json({ error: 'Dados inválidos: classId e associationTeacherData são obrigatórios e associationTeacherData não pode ser vazio.' });
            }

            const existingClass = await db.Classes.findByPk(classId);
            if (!existingClass) {
                return res.status(404).json({ error: 'Turma não encontrada!' });
            }

            const existingSemester = await db.Semester.findOne({
                include: [
                    {
                        model: db.Course,
                        as: 'courses',
                        where: { id: existingClass.courseId },
                        through: { attributes: [] }
                    }
                ],
                where: { number: existingClass.semester }
            });

            if (!existingSemester) {
                return res.status(404).json({ error: 'Semestre não encontrado para esta turma ou associação de curso inválida!' });
            }

            const updatedAssociations = [];

            for (const { discipline } of associationTeacherData) {
                if (!discipline || !discipline.id || !Array.isArray(discipline.teachers) || discipline.teachers.length === 0) {
                    return res.status(400).json({ error: 'Estrutura inválida para disciplina ou professores em associationTeacherData!' });
                }

                const existingDiscipline = await db.Discipline.findByPk(discipline.id);
                if (!existingDiscipline) {
                    return res.status(404).json({ error: `Disciplina com ID ${discipline.id} não encontrada!` });
                }

                const teacherIds = discipline.teachers;
                const existingTeachers = await db.User.findAll({
                    where: { id: teacherIds }
                });

                if (existingTeachers.length !== teacherIds.length) {
                    return res.status(404).json({ error: 'Um ou mais professores não encontrados para a disciplina fornecida!' });
                }

                let disciplineSemester = await db.DisciplineSemester.findOne({
                    where: {
                        disciplineId: discipline.id,
                        semesterId: existingSemester.id
                    }
                });

                if (!disciplineSemester) {
                    return res.status(404).json({ error: `Associação entre disciplina ${discipline.id} e semestre ${existingSemester.id} não encontrada para atualização!` });
                }

                updatedAssociations.push(disciplineSemester);
            }

            if (updatedAssociations.length === 0) {
                return res.status(200).json({ message: 'Nenhuma associação foi atualizada, possivelmente os dados já estavam os mesmos.', updated: false });
            }

            return res.status(200).json(updatedAssociations);
        } catch (error) {
            console.error('Erro ao atualizar planejamento:', error);
            return res.status(500).json({ error: 'Erro ao atualizar o planejamento docente para esta turma!', details: error.message });
        }
    },

    async removePlanning(req, res) {
        try {
            const { id } = req.params;

            const existingClass = await db.Classes.findByPk(id, {
                include: [
                    {
                        model: db.Course,
                        as: 'course',
                        required: true,
                        include: [
                            {
                                model: db.Semester,
                                as: 'semesters',
                                required: true,
                                through: { attributes: [] },
                                where: db.Sequelize.literal("`course->semesters`.`number` = `Classes`.`semester`"),
                                include: [
                                    {
                                        model: db.Discipline,
                                        as: 'disciplines',
                                        required: true,
                                        through: { attributes: [] },
                                        attributes: ['id', 'name']
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });

            if (!existingClass) {
                return res.status(404).json({ error: 'Turma não encontrada!' });
            }

            if (!existingClass.course || !existingClass.course.semesters || existingClass.course.semesters.length === 0) {
                return res.status(404).json({ error: 'Semestre associado à turma não encontrado!' });
            }

            const semester = existingClass.course.semesters[0];
            const disciplines = semester.disciplines;

            if (!disciplines || disciplines.length === 0) {
                return res.status(404).json({ error: 'Nenhuma disciplina associada ao semestre da turma!' });
            }

            const updatedDisciplines = await db.sequelize.transaction(async (transaction) => {
                const disciplineIds = disciplines.map(discipline => discipline.id);

                await db.SemesterClass.update(

                    { planning: false },
                    {
                        where: {
                            semesterId: semester.id,
                            classId: id
                        },
                        transaction
                    },
                );

                await db.PrefsDisciplines.destroy({
                    where: { disciplineId: { [db.Sequelize.Op.in]: disciplineIds } },
                    transaction
                });

                return disciplines.map(discipline => ({
                    disciplineId: discipline.id,
                    disciplineName: discipline.name
                }));
            });

            return res.status(200).json({
                message: 'Planejamento removido com sucesso!',
                updatedDisciplines
            });

        } catch (err) {
            console.error('Erro ao excluir planejamento:', err);
            return res.status(500).json({ error: 'Ocorreu um erro ao excluir o planejamento!', details: err.message });
        }
    }
};

export default CoordinationController;