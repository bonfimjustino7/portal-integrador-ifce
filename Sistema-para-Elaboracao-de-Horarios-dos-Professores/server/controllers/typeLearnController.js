import db from '../models/index.js';

const TypeLernController = {
    async create(req, res) {
        try {
            const { name } = req.body;
            
            const existingTypeLearn = await db.TypeLearn.findOne({where:{name}});
            if(existingTypeLearn){
                return res.status(406).json({error:"Já existe este tipo de ensino!"});
            }

            const typeLearn = await db.TypeLearn.create({
                name
            })

            res.status(201).json(typeLearn);
        } catch (error) {
            res.status(500).json({ error: 'Ocorreu um erro ao tentar criar o tipo de ensino!', details: error.message });
        }
    },

    async getAll(req, res) {
        try {
            const typeLearns = await db.TypeLearn.findAll({order:[['name','ASC']]});
            res.status(200).json(typeLearns);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar os tipos de ensino!', details: error.message });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const typeLearns = await db.TypeLearn.findByPk(id);
            if (!typeLearns) {
                return res.status(404).json({ error: 'Tipo de ensino não encontrado!' });
            }
            res.status(200).json(typeLearns);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao buscar o tipo de ensino!', details: error.message });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { name } = req.body;

            const typeLearn = await db.TypeLearn.findByPk(id);
            if (!typeLearn) {
                return res.status(404).json({ error: 'Tipo de ensino não encontrado!' });
            }

            const existingTypeLearn = await db.TypeLearn.findOne({where:{name}});
            if(existingTypeLearn.dataValues.id !== parseInt(id)){
                return res.status(406).json({error:"Já existe este tipo de ensino no sistema!"});
            }

            await typeLearn.update({ name });
            res.status(200).json(typeLearn);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao atualizar o tipo de ensino', details: error.message });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;

            const typeLearns = await db.TypeLearn.findByPk(id);
            if (!typeLearns) {
                return res.status(404).json({ error: 'Tipo de ensino não encontrado!' });
            }

            const courseWithTypeLearn = await db.Course.findOne({where: {typeLearnId: id}});
            if( courseWithTypeLearn){
                return res.status(406).json({error: 'Não é possível excluir este tipo de ensino, pois ele está associado a um curso!'});
            }

            await typeLearns.destroy();
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: 'Erro ao excluir o tipo de ensino!', details: error.message });
        }
    },
};

export default TypeLernController;