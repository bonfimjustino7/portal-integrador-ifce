import db from '../models/index.js';

const DisciplineController = {
    async create(req, res) {
        try {
            const { name, code, workload, credit } = req.body;

            const existingName = await db.Discipline.findOne({ where: { name, workload } });
            if (existingName) {
                return res.status(406).json({ error: 'Já existe uma disciplina com esse nome, carga horária e tipo.' });
            }

            const discipline = await db.Discipline.create({
                name,
                code,
                workload,
                credit,
            });

            return res.status(201).json(discipline);
        } catch (error) {
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar criar a disciplina', details: error.details });
        }
    },

    async getAll(req, res) {
        try {
            const disciplines = await db.Discipline.findAll({
                include: [
                    {
                        model: db.DisciplineSemester,
                        as: 'disciplineSemesters',
                        attributes: ['type'],
                        required: true
                    }
                ],
                order: [['name', 'ASC']]
            });
            return res.status(200).json(disciplines);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar disciplinas', details: error.message });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const discipline = await db.Discipline.findByPk(id);
            if (!discipline) {
                return res.status(404).json({ error: 'Disciplina não encontrada' });
            }
            return res.status(200).json(discipline);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar disciplina', details: error.message });
        }
    },

    async getByCoordination(req, res) {
        try {
            const { id } = req.params;
            const disciplines = await db.Discipline.findAll({
                include: [
                    {
                        model: db.Semester,
                        as: 'semesters',
                        attributes: [],
                        through: {
                            attributes: [],
                        },
                        required: true,
                        include: [{
                            model: db.Course,
                            as: 'courses',
                            where: { coordinationId: id },
                            attributes: [],
                            through: {
                                attributes: [],
                            },
                            required: true
                        }]
                    },
                    {
                        model: db.DisciplineSemester,
                        as: 'disciplineSemesters',
                        attributes: ['type'],
                        required: true
                    },
                ],

                order: [['name', 'ASC']]
            });

            if (!disciplines) {
                return res.status(404).json({ error: 'Disciplinas não encontradas' });
            }
            return res.status(200).json(disciplines);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao buscar disciplina', details: error.message });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, workload, credit } = req.body;

            const discipline = await db.Discipline.findByPk(id);
            if (!discipline) {
                return res.status(404).json({ error: 'Disciplina não encontrada' });
            }

            const existingName = await db.Discipline.findOne({ where: { name, workload } });
            if (existingName && existingName.dataValues.id !== parseInt(id)) {
                return res.status(406).json({ error: 'Já existe outra disciplina com esse nome, carga horária e modalidade!' })
            }

            await discipline.update({ name, workload, credit });
            return res.status(201).json(discipline);
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao atualizar disciplina', details: error.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;

            const discipline = await db.Discipline.findByPk(id);
            if (!discipline) {
                return res.status(404).json({ error: 'Disciplina não encontrada' });
            }

            await discipline.destroy();
            return res.status(204).send();
        } catch (error) {
            returnres.status(500).json({ error: 'Erro ao deletar disciplina', details: error.message });
        }
    },
};

export default DisciplineController;