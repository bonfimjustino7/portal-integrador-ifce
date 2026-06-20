import db from '../models/index.js';

const courseGridController = {
    async create(req, res) {
        try {
            const { courseId } = req.params;
            const { coordinatorId, type, year } = req.body;

            const existingCourse = await db.Course.findByPk(courseId);
            if (!existingCourse) {
                return res.status(404).json({ error: 'Curso não encontrado' });
            }

            const lastGrid = await db.GridCourse.findOne({
                order: [['id', 'DESC']],
                limit: 1
            });

            let name;

            if (!lastGrid) {
                name = `001 - ${existingCourse.name} - ${year}(${type})`;
            } else if (!type) {
                name = `00${lastGrid.id + 1} - ${existingCourse.name} - ${year}`;
            } else {
                name = `00${lastGrid.id + 1} - ${existingCourse.name} - ${year}(${type})`;
            }

            const existingCourseGrid = await db.GridCourse.findOne({
                where: {
                    courseId,
                    name
                }
            });

            if (existingCourseGrid) {
                return res.status(409).json({ error: `Já existe uma matriz curricular criada no ano ${currentYear} para o curso ${existingCourse.name}` });
            }

            const newGridCourse = await db.GridCourse.create({
                name,
                courseId
            });

            return res.status(201).json(newGridCourse);
        } catch (error) {
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar criar a matriz curricular!', details: error.message });
        }
    },

    async getAll(req, res) {
        try {
            const grids = await db.GridCourse.findAll({
                include: [
                    {
                        model: db.Course,
                        as: 'course',
                        attributes: ['id', 'name', 'code']
                    }
                ],
                order: [['name', 'ASC']],
            });

            if (!grids || grids.length === 0) {
                return res.status(404).json({ error: "Nenhuma matriz curricular encontrada." });
            }

            return res.status(200).json(grids);
        } catch (error) {
            return res.status(500).json({
                error: 'Ocorreu um erro ao tentar buscar as matrizes curriculares!',
                details: error.message
            });
        }
    },

    async getByCourse(req, res) {
        try {
            const { id } = req.params;
            const grids = await db.GridCourse.findAll({
                include: [
                    {
                        model: db.Course,
                        as: 'course',
                        attributes: ['id', 'name', 'code'],
                        where: {
                            coordinationId: id
                        }
                    }
                ],
                order: [['name', 'ASC']]
            });
            if (!grids) {
                return res.status(404).json({ error: "Nenhuma Matriz currícular encontrada!" });
            }
            return res.status(200).json(grids);
        } catch (error) {
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar buscar as matrizes currículares deste curso!', details: error.message });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { courseId } = req.body;

            const currentYear = new Date().getFullYear();

            const existingCourseGrid = await db.GridCourse.findByPk(id);
            if (!existingCourseGrid) {
                return res.status(404).json({ error: 'Grade curricular não encontrada!' });
            }

            const existingCourse = await db.Course.findByPk(courseId);

            if (!existingCourse) {
                return res.status(404).json({ error: 'Curso não encontrado!' });
            }

            if (existingCourseGrid.courseId !== courseId) {
                const name = `Matriz Currícular - ${existingCourse.name} - ${currentYear}`;

                await existingCourseGrid.update({
                    name,
                    courseId
                });

                return res.status(200).json(existingCourseGrid);
            } else {
                return res.status(200).json(existingCourseGrid);
            }
        } catch (error) {
            return res.status(500).json({
                error: 'Ocorreu um erro ao tentar atualizar a matriz currícular!',
                details: error.message
            });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const grid = await db.GridCourse.findByPk(id);
            if (!grid) {
                return res.status(404).json({ error: "Matriz currícular não encontrada!" });
            }
            await db.CourseGridSemester.destroy({ where: { gridCourseId: id } });
            await grid.destroy();

            return res.status(204).send();
        } catch (error) {
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar excluir a matriz currícular!', details: error.message });
        }
    },

    async associateDiscipline(req, res) {
        try {
            const { gridCourseId } = req.params;
            const { semesterId, disciplines,courseId } = req.body;

            // Validar entrada
            if (!semesterId || !Number.isInteger(semesterId)) {
                return res.status(406).json({ error: 'semesterId deve ser um número inteiro válido!' });
            }
            if (!disciplines || !Array.isArray(disciplines) || disciplines.length === 0) {
                return res.status(406).json({ error: 'disciplines deve ser um array não vazio de objetos!' });
            }

            // Validar cada disciplina
            for (const discipline of disciplines) {
                if (!discipline.disciplineId || !Number.isInteger(discipline.disciplineId) || !discipline.type) {
                    return res.status(406).json({ error: 'Cada disciplina deve ter disciplineId (inteiro) e type!' });
                }
            }

            const transaction = await db.sequelize.transaction();

            try {
                const semester = await db.Semester.findOne({
                    where: { id: semesterId },
                    transaction
                });
                if (!semester) {
                    throw new Error(`semesterId ${semesterId} não encontrado na tabela semesters!`);
                }

                const gridCourse = await db.GridCourse.findOne({
                    where: { id: gridCourseId },
                    transaction
                });
                if (!gridCourse) {
                    throw new Error(`gridCourseId ${gridCourseId} não encontrado na tabela grid-course!`);
                }

                for (const discipline of disciplines) {
                    const { disciplineId, type } = discipline;

                    const disciplineRecord = await db.Discipline.findOne({
                        where: { id: disciplineId },
                        transaction
                    });
                    if (!disciplineRecord) {
                        throw new Error(`disciplineId ${disciplineId} não encontrado na tabela discipline!`);
                    }

                    let disciplineSemester = await db.DisciplineSemester.findOne({
                        where: { semesterId, disciplineId },
                        transaction
                    });

                    if (disciplineSemester) {
                        await disciplineSemester.update(
                            { type },
                            { transaction }
                        );
                    } else {
                        disciplineSemester = await db.DisciplineSemester.create(
                            {
                                semesterId,
                                disciplineId,
                                type,
                                courseId
                            },
                            { transaction }
                        );
                    }

                    const existingAssociation = await db.CourseGridSemester.findOne({
                        where: { gridCourseId, disciplineSemesterId: disciplineSemester.id },
                        transaction
                    });

                    if (!existingAssociation) {
                        await db.CourseGridSemester.create(
                            {
                                gridCourseId,
                                disciplineSemesterId: disciplineSemester.id
                            },
                            { transaction }
                        );
                    }
                }

                await transaction.commit();
                return res.status(200).json({ message: 'Disciplinas associadas ao semestre e à matriz curricular com sucesso!' });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            return res.status(500).json({
                error: 'Ocorreu um erro ao tentar associar as disciplinas ao semestre e à matriz curricular!',
                details: error.message,
            });
        }
    },

    async getDisciplinesAssocieted(req, res) {
        try {
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({ error: 'O id da matriz é obrigatório!' });
            }

            const parsedId = parseInt(id, 10);
            if (isNaN(parsedId)) {
                return res.status(400).json({ error: 'O ID da matriz deve ser um número válido.' });
            }

            const grid = await db.GridCourse.findByPk(parsedId, {
                attributes: ['id', 'name']
            });

            if (!grid) {
                return res.status(404).json({ message: 'Nenhuma disciplina encontrada para a matriz curricular.' });
            }

            const gridCourses = await db.CourseGridSemester.findAll({
                where: { gridCourseId: parsedId },
                include: [
                    {
                        model: db.DisciplineSemester,
                        as: 'disciplineSemesters',
                        attributes: ['semesterId', 'type'],
                        required: true,
                        include: [
                            {
                                model: db.Discipline,
                                as: 'disciplines',
                                required: true,
                                attributes: ['id', 'name', 'code', 'workload', 'credit']
                            }
                        ]
                    }
                ],
                order: [[{ model: db.DisciplineSemester, as: 'disciplineSemesters' }, 'semesterId', 'ASC']]
            });

            if (!gridCourses || gridCourses.length === 0) {
                return res.status(404).json({ message: 'Nenhuma disciplina encontrada para a matriz curricular.' });
            }

            const formattedSemesters = [];

            for (const gridCourse of gridCourses) {
                for (const disciplineSemester of gridCourse.disciplineSemesters) {
                    const semesterRecord = await db.Semester.findByPk(disciplineSemester.semesterId);
                    if (!semesterRecord) continue;

                    let semesterEntry = formattedSemesters.find(s => s.semesterId === semesterRecord.id);
                    if (!semesterEntry) {
                        semesterEntry = {
                            semesterId: semesterRecord.id,
                            semesterCode: semesterRecord.code,
                            disciplines: []
                        };
                        formattedSemesters.push(semesterEntry);
                    }

                    // Garante que disciplines seja sempre um array
                    const disciplines = disciplineSemester.disciplines
                        ? Array.isArray(disciplineSemester.disciplines)
                            ? disciplineSemester.disciplines
                            : [disciplineSemester.disciplines]
                        : [];

                    for (const discipline of disciplines) {
                        semesterEntry.disciplines.push({
                            disciplineId: discipline.id,
                            disciplineName: discipline.name,
                            disciplineCode: discipline.code,
                            DisciplineWorkLoad: discipline.workload,
                            DisciplineCredit: discipline.credit,
                            type: disciplineSemester.type
                        });
                    }
                }
            }

            return res.status(200).json([{
                gridCourseId: grid.id,
                gridCourseName: grid.name,
                semesters: formattedSemesters.sort((a, b) => a.semesterId - b.semesterId)
            }]);

        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao trazer as disciplinas da matriz curricular!',
                details: error.message,
            });
        }
    },

    async getAllDisciplinesAssocieted(req, res) {
        try {
            const grids = await db.GridCourse.findAll({
                include: [
                    {
                        model: db.Course,
                        as: 'course',
                        attributes: ['id', 'name', 'code'],
                        required: true
                    },
                    {
                        model: db.DisciplinesSemester,
                        as: 'disciplinesGrid',
                        required: true,
                        attributes: ['semesterId', 'type'],
                        include: [
                            {
                                model: db.Discipline,
                                as: 'disciplines',
                                required: false, // pode não ter disciplinas
                                attributes: ['id', 'name', 'workload', 'credit', 'code']
                            }
                        ]
                    }
                ],
                order: [['name', 'ASC']],
            });

            if (!grids || grids.length === 0) {
                return res.status(404).json({ message: 'Nenhuma matriz curricular encontrada.' });
            }

            const formattedData = [];

            for (const grid of grids) {
                const semesters = [];

                for (const disciplineSemester of grid.disciplinesGrid) {
                    const semesterRecord = await db.Semester.findByPk(disciplineSemester.semesterId);
                    if (!semesterRecord) continue;

                    let semesterEntry = semesters.find(s => s.semesterId === semesterRecord.id);
                    if (!semesterEntry) {
                        semesterEntry = {
                            semesterId: semesterRecord.id,
                            semesterCode: semesterRecord.code,
                            disciplines: []
                        };
                        semesters.push(semesterEntry);
                    }

                    const disciplines = disciplineSemester.disciplines
                        ? Array.isArray(disciplineSemester.disciplines)
                            ? disciplineSemester.disciplines
                            : [disciplineSemester.disciplines]
                        : [];

                    for (const discipline of disciplines) {
                        semesterEntry.disciplines.push({
                            disciplineId: discipline.id,
                            disciplineName: discipline.name,
                            disciplineCode: discipline.code,
                            DisciplineWorkLoad: discipline.workload,
                            DisciplineCredit: discipline.credit,
                            type: disciplineSemester.type
                        });
                    }
                }

                formattedData.push({
                    gridCourseId: grid.id,
                    gridCourseName: grid.name,
                    semesters: semesters.sort((a, b) => a.semesterId - b.semesterId)
                });
            }

            return res.status(200).json(formattedData);

        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao trazer as disciplinas da matriz curricular!',
                details: error.message
            });
        }
    }

};

export default courseGridController;