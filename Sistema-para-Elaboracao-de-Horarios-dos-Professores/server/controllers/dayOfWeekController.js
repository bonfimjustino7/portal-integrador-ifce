import db from '../models/index.js';

const DayOfWeekController = {

    async getAll(req, res) {
        try {
            const days = await db.DayOfWeek.findAll({order:[['id','ASC']]});
            res.status(200).json(days);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar os dias da semana!', details: error.message });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const day = await db.DayOfWeek.findByPk(id);
            if (!day) {
                return res.status(404).json({ error: 'Dia da semana não encontrado!' });
            }
            res.status(200).json(day);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar o dia da semana!', details: error.message });
        }
    },

};

export default DayOfWeekController;