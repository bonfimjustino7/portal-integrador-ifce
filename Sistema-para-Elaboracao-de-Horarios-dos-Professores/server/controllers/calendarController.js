import db from '../models/index.js';

const CalendarController = {
    async create(req, res) {
        try {
            const { academicYear, dateStart, dateEnd, dateClose, type, period, typeLearnsIds } = req.body;

            if (!academicYear || !typeLearnsIds || !dateStart || !dateEnd || !dateClose || !type || !period) {
                return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
            }

            if (!/^\d{4}$/.test(academicYear)) {
                return res.status(400).json({ error: 'O ano acadêmico deve conter exatamente 4 dígitos.' });
            }
            const currentYear = new Date().getFullYear();
            const maxYear = currentYear + 5;
            const year = parseInt(academicYear, 10);
            if (year < currentYear || year > maxYear) {
                return res.status(400).json({ error: `O ano acadêmico deve estar entre ${currentYear} e ${maxYear}.` });
            }

            const parsedPeriod = parseInt(period, 10);
            if (isNaN(parsedPeriod) || (parsedPeriod !== 1 && parsedPeriod !== 2)) {
                return res.status(400).json({ error: "Informe um período válido (1 ou 2)." });
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDateObj = new Date(dateStart + 'T00:00:00.000Z');
            const endDateObj = new Date(dateEnd + 'T00:00:00.000Z');
            const closeDateObj = new Date(dateClose + 'T00:00:00.000Z');

            const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

            if (startDateObj < todayUTC) {
                return res.status(400).json({ error: 'A data de início não pode ser anterior ao dia atual.' });
            }

            if (endDateObj < startDateObj) {
                return res.status(400).json({ error: 'A data de término não pode ser anterior à data de início.' });
            }

            if (closeDateObj < endDateObj) {
                return res.status(400).json({ error: 'A data de fechamento deve ser igual ou posterior à data de término.' });
            }

            let typeLearnNames = [];
            for (const elementId of typeLearnsIds) {
                const existingTypeLearn = await db.TypeLearn.findByPk(elementId);
                if (!existingTypeLearn) {
                    return res.status(404).json({ error: 'Não foi possível encontrar o tipo de ensino!' });
                }
                typeLearnNames.push(existingTypeLearn.dataValues.name);
            }

            const typeLearnString = typeLearnsIds.length > 0 ? `${typeLearnNames.join('/')}` : '';

            const name = `${academicYear}.${parsedPeriod} - ${type} - ${typeLearnString}`;

            const existingCalendar = await db.Calendar.findOne({
                where: {
                    name
                }
            });
            if (existingCalendar) {
                return res.status(409).json({ error: "Já existe um calendário com essas combinações no sistema!" });
            }

            const calendar = await db.Calendar.create({
                name,
                dateStart: startDateObj,
                dateEnd: endDateObj,
                dateClose: closeDateObj,
                type,
                period: parsedPeriod,
                active: true
            });

            for (const typeLearnId of typeLearnsIds) {
                await db.CalendarTypeLearn.create({
                    calendarId: calendar.id,
                    typeLearnId
                });
            }

            return res.status(201).json(calendar);
        } catch (error) {
            console.error('Erro ao criar calendário:', error);
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar criar o calendário!', details: error.message });
        }
    },

    async getAll(req, res) {
        try {
            const calendars = await db.Calendar.findAll({
                include: [
                    { model: db.TypeLearn, as: 'typeLearn', through: { attributes: [] } }
                ],
                order: [['name', 'ASC']],
                where: {
                    active: true
                }
            });

            if (!calendars || calendars.length === 0) {
                return res.status(404).json({ error: "Nenhum calendário encontrado." });
            }

            return res.status(200).json(calendars);
        } catch (error) {
            console.error('Erro ao buscar calendários:', error);
            return res.status(500).json({
                error: 'Ocorreu um erro ao tentar buscar os calendários!',
                details: error.message
            });
        }
    },

    async getCalendarPlanning(req, res) {
        try {
            const calendars = await db.Calendar.findAll({
                attributes: ['id', 'name', 'type', 'dateStart', 'dateEnd', 'dateClose', 'active'],
                order: [['name', 'ASC']],
                where: {
                    active: true,
                },
                include: [
                    {
                        model: db.Classes,
                        as: 'classes',
                        required: true,
                        attributes: [],
                        include: [
                            {
                                model: db.Course,
                                as: 'course',
                                attributes: [],
                                required: true,
                                include: [
                                    {
                                        model: db.Semester,
                                        as: 'semesters',
                                        attributes: [],
                                        required: true,
                                        through: {
                                            attributes: []
                                        },
                                        include: [
                                            {
                                                model: db.SemesterClass,
                                                as: 'semesterClasses',
                                                required: true,
                                                where: { planning: true },
                                                attributes: []
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            });

            if (!calendars || calendars.length === 0) {
                return res.status(404).json({ error: "Nenhum calendário encontrado." });
            }

            return res.status(200).json(calendars);
        } catch (error) {
            console.error('Erro ao buscar tipos de calendário:', error);
            return res.status(500).json({
                error: 'Ocorreu um erro ao tentar buscar os tipos de calendário!',
                details: error.message
            });
        }
    },

    async getCalendarYear(req, res) {
        try {
            const calendars = await db.Calendar.findAll({
                attributes: ['id', 'name'],
                order: [['name', 'ASC']],
                where: {
                    active: true
                }
            });

            if (!calendars || calendars.length === 0) {
                return res.status(404).json({ error: "Nenhum calendário encontrado." });
            }

            const uniqueYears = new Set();
            const calendarYears = [];

            for (const cal of calendars) {
                const nameSplited = cal.name.trim().split('-');
                const year = nameSplited[0].trim();

                if (!uniqueYears.has(year)) {
                    uniqueYears.add(year);
                    calendarYears.push({
                        id: cal.id,
                        year
                    });
                }
            }

            return res.status(200).json(calendarYears);
        } catch (error) {
            console.error('Erro ao buscar calendários:', error);
            return res.status(500).json({
                error: 'Ocorreu um erro ao tentar buscar os calendários!',
                details: error.message
            });
        }
    },

    async getCalendarType(req, res) {
        try {
            const calendars = await db.Calendar.findAll({
                attributes: ['id', 'name', 'type'],
                order: [['name', 'ASC']],
                where: {
                    active: true
                }
            });

            if (!calendars || calendars.length === 0) {
                return res.status(404).json({ error: "Nenhum calendário encontrado." });
            }

            const uniqueTypes = [...new Set(calendars.map(cal => cal.type))];
            const formattedTypes = uniqueTypes.map(type => ({ type: type }));

            return res.status(200).json(formattedTypes);
        } catch (error) {
            console.error('Erro ao buscar tipos de calendário:', error);
            return res.status(500).json({
                error: 'Ocorreu um erro ao tentar buscar os tipos de calendário!',
                details: error.message
            });
        }
    },

    async getById(req, res) {
        try {
            const { id } = req.params;
            const calendar = await db.Calendar.findByPk(id, {
                include: [
                    { model: db.TypeLearn, as: 'typeLearn', through: { attributes: [] } }
                ],
                order: [['name', 'ASC']]
            });
            if (!calendar) {
                return res.status(404).json({ error: "Calendário não encontrado!" });
            }
            return res.status(200).json(calendar);
        } catch (error) {
            console.error('Erro ao buscar calendário por ID:', error);
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar buscar o calendário!', details: error.message });
        }
    },

    async getCalendarHours(req, res) {
        try {
            const calendars = await db.Calendar.findAll({
                order: [['name', 'ASC']],
                attributes: ['id', 'name', 'type'],
                where: {
                    active: true
                }
            });

            if (!calendars || calendars.length === 0) {
                return res.status(404).json({ error: "Nenhum calendário encontrado." });
            }

            const schedulesWithThisCalendar = await db.HourGrid.findAll({
                where: {
                    calendarId: calendars.map(cal => cal.id),
                    active: true,
                },
                attributes: ['calendarId', 'createdAt', 'publicated']
            });

            if (!schedulesWithThisCalendar || schedulesWithThisCalendar.length === 0) {
                return res.status(404).json({ error: 'Nenhum horário encontrado para os calendários ativos.' })
            }

            const activeCalendars = calendars.filter(cal => {
                return schedulesWithThisCalendar.some(schedule => schedule.calendarId === cal.id);
            })

            if (activeCalendars.length === 0) {
                return res.status(404).json({ error: 'Nenhum calendário ativo possui horários registrados.' })
            }

            activeCalendars.forEach(cal => {

            })

            const formattedCalendar = []
            activeCalendars.forEach(cal => {
                const schedule = schedulesWithThisCalendar.find(schedule => schedule.calendarId === cal.id);
                formattedCalendar.push({
                    'id': cal.id,
                    'name': cal.name,
                    'type': cal.type,
                    'createdAt': schedule.createdAt || null,
                    'publicated': schedule.publicated || false,
                });
            });

            return res.status(200).json(formattedCalendar);
        } catch (error) {
            console.error('Erro ao buscar calendários:', error);
            return res.status(500).json({
                error: 'Ocorreu um erro ao tentar buscar os calendários que possuem horários ativos!',
                details: error.message
            });
        }
    },

    async getCalendarHoursPublicated(req, res) {
        try {
            const calendars = await db.Calendar.findAll({
                order: [['name', 'ASC']],
                attributes: ['id', 'name', 'type'],
                where: {
                    active: true
                }
            });

            if (!calendars || calendars.length === 0) {
                return res.status(404).json({ error: "Nenhum calendário encontrado." });
            }

            const schedulesWithThisCalendar = await db.HourGrid.findAll({
                where: {
                    calendarId: calendars.map(cal => cal.id),
                    active: true,
                    publicated: true
                },
                attributes: ['calendarId', 'createdAt', 'publicated']
            });

            if (!schedulesWithThisCalendar || schedulesWithThisCalendar.length === 0) {
                return res.status(404).json({ error: 'Nenhum calendário com horários publicados foi encontrado.' });
            }

            const activeCalendars = calendars.filter(cal => {
                return schedulesWithThisCalendar.some(schedule => schedule.calendarId === cal.id);
            });

            if (activeCalendars.length === 0) {
                return res.status(404).json({ error: 'Nenhum calendário com horários publicados.' });
            }

            const formattedCalendar = [];
            activeCalendars.forEach(cal => {
                const schedule = schedulesWithThisCalendar.find(schedule => schedule.calendarId === cal.id);
                formattedCalendar.push({
                    'id': cal.id,
                    'name': cal.name,
                    'type': cal.type,
                    'createdAt': schedule.createdAt || null,
                    'publicated': schedule.publicated || false,
                });
            });

            return res.status(200).json(formattedCalendar);
        } catch (error) {
            console.error('Erro ao buscar calendários:', error);
            return res.status(500).json({
                error: 'Ocorreu um erro ao tentar buscar os calendários que possuem horários publicados!',
                details: error.message
            });
        }
    },

    async update(req, res) {
        try {
            const { id } = req.params;
            const { academicYear, dateStart, dateEnd, dateClose, type, period, typeLearnsIds } = req.body;

            if (!academicYear || !typeLearnsIds || !dateStart || !dateEnd || !dateClose || !type || !period) {
                return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
            }

            if (!/^\d{4}$/.test(academicYear)) {
                return res.status(400).json({ error: 'O ano acadêmico deve conter exatamente 4 dígitos.' });
            }

            const currentYear = new Date().getFullYear();
            const maxYear = currentYear + 5;
            const year = parseInt(academicYear, 10);
            if (year < currentYear || year > maxYear) {
                return res.status(400).json({ error: `O ano acadêmico deve estar entre ${currentYear} e ${maxYear}.` });
            }

            const parsedPeriod = parseInt(period, 10);
            if (isNaN(parsedPeriod) || (parsedPeriod !== 1 && parsedPeriod !== 2)) {
                return res.status(400).json({ error: "Informe um período válido (1 ou 2)." });
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

            const startDateObj = new Date(dateStart + 'T00:00:00.000Z');
            const endDateObj = new Date(dateEnd + 'T00:00:00.000Z');
            const closeDateObj = new Date(dateClose + 'T00:00:00.000Z');

            if (startDateObj < todayUTC) {
                return res.status(400).json({ error: 'A data de início não pode ser anterior ao dia atual.' });
            }

            if (endDateObj < startDateObj) {
                return res.status(400).json({ error: 'A data de término não pode ser anterior à data de início.' });
            }

            if (closeDateObj < endDateObj) {
                return res.status(400).json({ error: 'A data de fechamento deve ser igual ou posterior à data de término.' });
            }

            let typeLearnNames = [];
            for (const elementId of typeLearnsIds) {
                const existingTypeLearn = await db.TypeLearn.findByPk(elementId);
                if (!existingTypeLearn) {
                    return res.status(404).json({ error: 'Não foi possível encontrar o tipo de ensino!' });
                }
                typeLearnNames.push(existingTypeLearn.dataValues.name);
            }

            const typeLearnString = typeLearnsIds.length > 0 ? `${typeLearnNames.join('/')}` : '';

            const name = `${academicYear}.${parsedPeriod} - ${typeLearnString} - ${type}`;

            const calendarToUpdate = await db.Calendar.findByPk(id);
            if (!calendarToUpdate) {
                return res.status(404).json({ error: 'Calendário não encontrado.' });
            }

            const existingCalendar = await db.Calendar.findOne({
                where: { name }
            });

            if (existingCalendar && existingCalendar.id !== parseInt(id)) {
                return res.status(409).json({ error: "Já existe um calendário com essas combinações no sistema!" });
            }

            await calendarToUpdate.update({
                name,
                dateStart: startDateObj,
                dateEnd: endDateObj,
                dateClose: closeDateObj,
                type,
                period: parsedPeriod
            });

            await db.CalendarTypeLearn.destroy({ where: { calendarId: id } });

            for (const typeLearnId of typeLearnsIds) {
                await db.CalendarTypeLearn.create({
                    calendarId: id,
                    typeLearnId: typeLearnId
                });
            }

            return res.status(200).json(calendarToUpdate);
        } catch (error) {
            console.error('Erro ao atualizar calendário:', error);
            return res.status(500).json({
                error: 'Ocorreu um erro ao tentar atualizar o calendário!',
                details: error.message
            });
        }
    },

    async delete(req, res) {
        try {
            const { id } = req.params;
            const calendar = await db.Calendar.findByPk(id);
            if (!calendar) {
                return res.status(404).json({ error: "Calendário não encontrado!" });
            }
            const classes = await db.Classes.findAll({ where: { calendarId: id } });
            if (classes.length > 0) {
                return res.status(406).json({ error: "Não é possível excluir um calendário que possui aulas associadas!" });
            }
            await db.CalendarTypeLearn.destroy({ where: { calendarId: id } });
            await calendar.destroy();
            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao deletar calendário:', error);
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar excluir o calendário!', details: error.message });
        }
    },

    async deactivate(req, res) {
        try {
            const { id } = req.params;
            const calendar = await db.Calendar.findByPk(id);
            if (!calendar) {
                return res.status(404).json({ error: "Calendário não encontrado!" });
            }
            calendar.active = false;
            await calendar.save();
            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao desativar calendário:', error);
            return res.status(500).json({ error: 'Ocorreu um erro ao tentar desativar o calendário!', details: error.message });
        }
    }
};

export default CalendarController;