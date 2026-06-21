import db from '../models/index.js';

const TurnController = {
    async create(req, res) {
        try {
            const { name, code } = req.body;

            const existingTurn = await db.Turn.findOne({
                where: {
                    name,
                    code
                }
            })
            if (existingTurn) {
                return res.status(406).json({ error: "Este turno já esta cadastrado no sistema" });
            }

            const turn = await db.Turn.create({
                name,
                code
            });

            return res.status(201).json(turn);
        } catch (error) {
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar criar o turno', details: error.message })
        }
    },

    async getAll(req, res) {
        try {
            const turn = await db.Turn.findAll({order:[['name','ASC']]});
            if (!turn) {
                res.status(404).json({ error: "Não foi possivel encontrar os turnos!" });
            }

            res.status(200).json(turn);
        } catch (error) {
            res.status(500).json({ error: 'Ocorreu um erro ao tentar buscar os turnos!', details: error.message })
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const turn = await db.Turn.findByPk(id);
            if (!turn) {
                res.status(404).json({ error: "Não foi possivel encontrar o turno!" });
            }

            res.status(200).json(turn);
        } catch (error) {
            res.status(500).json({ error: 'Ocorreu um erro ao tentar buscar o turno!', details: error.message })
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, code } = req.body;

            const existingTurn = await db.Turn.findOne({
                where: { name, code }
            });

            if (existingTurn && String(existingTurn.id) !== String(id)) {
                return res.status(406).json({ error: "Já existe este turno registrado no sistema!" });
            }

            const turn = await db.Turn.findByPk(id);

            if (!turn) {
                return res.status(404).json({ error: "Turno não encontrado." });
            }

            if (typeof name === 'string' && name.trim() !== '') {
                turn.name = name;
            }

            if (typeof code === 'string' && code.trim() !== '') {
                turn.code = code;
            }

            await turn.save();

            return res.status(201).json(turn);
        } catch (error) {
            return res.status(500).json({
                error: 'Ocorreu um erro ao tentar atualizar o turno!',
                details: error.message
            });
        }
    },


    async delete(req, res) {
        try {
            const { id } = req.params;
            const turn = await db.Turn.findByPk(id);
            if (!turn) {
                res.status(404).json({ error: "Não foi possivel encontrar o turno" });
            }

            await turn.destroy();
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Ocorreu um erro ao tentar excluir o turno!', details: error.message })
        }
    }
}

export default TurnController;