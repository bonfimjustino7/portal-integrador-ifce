import db from '../models/index.js';

const HourController = {
    async getHours(req,res){
        try {
            const hours = await db.Hours.findAll({
                attributes: ['id','hourStart','hourEnd'],
                include: [
                    {
                        model: db.Turn,
                        as: 'turn',
                        attributes: ['id','name']
                    }
                ]
            });
            if(!hours || hours.length === 0){
                return res.status(404).json({error: 'Nenhum horário encontrado!'});
            }

            return res.status(200).json(hours);
        }
        catch (err){
            return res.status(500).json({error: 'Erro ao buscar os horários!',details: err.message})
        }
    }
}

export default HourController;