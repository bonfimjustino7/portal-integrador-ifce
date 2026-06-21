import { Op } from 'sequelize';
import db from '../models/index.js';
import bcrypt from 'bcrypt';

const isValidEmail = (email) => {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return email.length <= 254 && emailRegex.test(email);
};

const UserController = {
  async viewTeachers(req, res) {
    try {
      const teachers = await db.User.findAll({
        where: {
          [db.Sequelize.Op.or]: [
            { role: 'Professor' },
          ]
        },
        include: [
          { model: db.DayOfWeek, as: 'prefsDays', through: { attributes: ['observation'] } },
        ],
        order: [['name', 'ASC']]
      });
      res.status(200).json(teachers);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar os professores', details: error.message });
    }
  },

  async registerTeacher(req, res) {
    const { name, email, password, nameCode } = req.body;

    if (!name || !email || !password || !nameCode) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    if ([name, email, password, nameCode].some(field => typeof field === 'string' && field.trim() === '')) {
      return res.status(400).json({ error: 'Nenhum campo pode ser vazio.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'O email fornecido não é válido.' });
    }

    try {
      const existingUserByEmail = await db.User.findOne({ where: { email } });
      if (existingUserByEmail) {
        return res.status(409).json({ error: 'Este email já está em uso.' });
      }

      const existingUserByNameCode = await db.User.findOne({ where: { nameCode } });
      if (existingUserByNameCode) {
        return res.status(409).json({ error: 'O código do nome já está em uso.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newTeacher = await db.User.create({
        name,
        email,
        password: hashedPassword,
        role: 'Professor',
        nameCode,
      });
      res.status(201).json(newTeacher);
    } catch (error) {
      console.error('Error in registerTeacher:', error);
      res.status(500).json({ error: 'Erro ao registrar o professor!', details: error.message });
    }
  },

  async register(req, res) {
    const { name, email, password, role, nameCode } = req.body;

    if (!name || !email || !password || !role || !nameCode) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    if ([name, email, password, role, nameCode].some(field => typeof field === 'string' && field.trim() === '')) {
      return res.status(400).json({ error: 'Nenhum campo pode ser vazio.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'O email fornecido não é válido.' });
    }

    try {
      const existingUserByEmail = await db.User.findOne({ where: { email } });
      if (existingUserByEmail) {
        return res.status(409).json({ error: 'Este email já está em uso.' });
      }

      const existingUserByNameCode = await db.User.findOne({ where: { nameCode } });
      if (existingUserByNameCode) {
        return res.status(409).json({ error: 'O código do nome já está em uso.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = await db.User.create({
        name,
        email,
        password: hashedPassword,
        role,
        nameCode,
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error in register:', error);
      res.status(500).json({ error: 'Erro ao registrar o usuário!', details: error.message });
    }
  },

  // Editar/cadastrar preferências do professor
  async setPreferences(req, res) {
    try {
      const user = await db.User.findByPk(req.params.id, {
        where: { role: 'Professor' }
      });
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado, ou o usuário não é um professor!' });
      }
      const { prefDisciplines, prefDays } = req.body;

      if (prefDisciplines) await user.addPrefDisciplines(prefDisciplines);
      if (prefDays) await user.setPrefsDays(prefDays);

      res.status(200).json({ user, prefDisciplines, prefDays });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao cadastrar/atualizar preferências para o professor', details: error.message });
    }
  },

  async updatePreferences(req, res) {
    try {
      const user = await db.User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }
      if (user.role !== 'Professor') {
        return res.status(403).json({ message: 'O usuário não é um professor.' });
      }

      const { prefDisciplines, prefDays, courseId } = req.body;
      if (!Array.isArray(prefDisciplines) || !Array.isArray(prefDays)) {
        return res.status(400).json({ message: 'Os campos prefDisciplines e prefDays devem ser arrays.' });
      }

      const transaction = await db.sequelize.transaction();

      try {
        await db.PrefsDisciplines.destroy({
          where: {
            userId: user.id,
            disciplineId: { [Op.notIn]: prefDisciplines.filter(id => id) },
            courseId
          },
          transaction
        });


        await db.PreferencesDay.destroy({
          where: {
            userId: user.id,
            dayId: { [Op.notIn]: prefDays.filter(id => id) }
          },
          transaction
        });

        const disciplinePromises = prefDisciplines
          .filter(id => id)
          .map(disciplineId =>
            db.PrefsDisciplines.findOrCreate({
              where: { userId: user.id, disciplineId },
              defaults: { userId: user.id, disciplineId },
              transaction
            })
          );

        const dayPromises = prefDays
          .filter(id => id)
          .map(dayId =>
            db.PreferencesDay.findOrCreate({
              where: { userId: user.id, dayId },
              defaults: { userId: user.id, dayId },
              transaction
            })
          );

        await Promise.all([...disciplinePromises, ...dayPromises]);

        await transaction.commit();

        const updatedDisciplines = await db.PrefsDisciplines.findAll({
          where: { userId: user.id },
          attributes: ['disciplineId'],
          raw: true
        });
        const updatedDays = await db.PreferencesDay.findAll({
          where: { userId: user.id },
          attributes: ['dayId'],
          raw: true
        });

        res.status(200).json({
          message: 'Preferências atualizadas com sucesso.',
          user,
          prefDisciplines: updatedDisciplines.map(d => d.disciplineId),
          prefDays: updatedDays.map(d => d.dayId)
        });
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Erro ao atualizar preferências para o professor:', error);
      res.status(500).json({ message: 'Erro ao atualizar preferências do professor.' });
    }
  },

  async deletePreferences(req, res) {
    try {
      const user = await db.User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }
      if (user.role !== 'Professor') {
        return res.status(403).json({ message: 'O usuário não é um professor.' });
      }

      const { disciplineId } = req.params;

      await db.PrefsDisciplines.destroy({
        where: {
          userId: user.id,
          disciplineId
        },
      });

      res.status(204).send();

    } catch (error) {
      console.error('Erro ao remover preferências para o professor:', error);
      res.status(500).json({ message: 'Erro ao remover preferências do professor.' });
    }
  },

  async setPreferencesDay(req, res) {
    try {
      const { id } = req.params;
      const user = await db.User.findByPk(id, {
        where: { role: 'Professor' }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado, ou o usuário não é um professor!' });
      }

      const { prefDays } = req.body;

      await db.PreferencesDay.destroy({
        where: { userId: id }
      });

      await prefDays.map(async preferences => {
        await db.PreferencesDay.create({
          userId: id,
          dayId: preferences.dayId,
          observation: preferences.observation || null
        });
      });

      res.status(201).json({ user, prefDays });
    } catch (error) {
      console.error("Erro ao cadastrar/atualizar preferências:", error);
      res.status(500).json({ error: 'Erro ao cadastrar/atualizar preferências para o professor', details: error.message });
    }
  },

  // Visualizar preferências do professor
  async getPreferencesById(req, res) {
    try {
      const user = await db.User.findByPk(req.params.id, {
        include: [
          { model: db.Discipline, as: 'prefDisciplines' },
          { model: db.DayOfWeek, as: 'prefsDays', through: { attributes: ['observation'] } },
        ],
      });
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado, ou o usuário não é um professor!' });
      }
      res.json({
        user
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar preferências do professor', details: error.message });
    }
  },

  async getDaysPreferencesById(req, res) {
    try {
      const user = await db.User.findByPk(req.params.id, {
        include: [
          { model: db.DayOfWeek, as: 'prefsDays', through: { attributes: ['observation'] } },
        ],
        order: [[{ model: db.DayOfWeek, as: 'prefsDays' }, 'id', 'ASC']],
      });
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado, ou o usuário não é um professor!' });
      }
      res.json(user.prefsDays);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar preferências do professor', details: error.message });
    }
  },

  async getPreferences(req, res) {
    try {
      const users = await db.User.findAll({
        include: [
          { model: db.Discipline, as: 'prefDisciplines' },
          { model: db.DayOfWeek, as: 'prefsDays' },
        ],
        where: { role: 'Professor' }
      });
      if (!users) {
        return res.status(404).json({ error: 'Professores não encontrados!' });
      }
      res.json({ users });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar as preferências dos professores!', details: error.message });
    }
  },

  async updateUser(req, res) {
    const { id } = req.params;
    const { name, email, role, nameCode, password } = req.body;

    if ([name, email, role, nameCode].some(field => field === null || field === undefined)) {
      return res.status(400).json({ error: 'Os campos nome, email, código do nome e cargo são obrigatórios.' });
    }
    if ([name, email, role, nameCode].some(field => typeof field === 'string' && field.trim() === '')) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'O email fornecido não é válido.' });
    }

    try {
      const userToUpdate = await db.User.findByPk(id);

      if (!userToUpdate) {
        return res.status(404).json({ message: 'Usuário não encontrado!' });
      }

      if (email !== userToUpdate.email) {
        const existingUserByEmail = await db.User.findOne({
          where: {
            email,
            id: { [db.Sequelize.Op.ne]: id }
          }
        });
        if (existingUserByEmail) {
          return res.status(409).json({ error: 'Este email já está em uso por outro usuário.' });
        }
      }

      if (nameCode !== userToUpdate.nameCode) {
        const existingUserByNameCode = await db.User.findOne({
          where: {
            nameCode,
            id: { [db.Sequelize.Op.ne]: id }
          }
        });
        if (existingUserByNameCode) {
          return res.status(409).json({ error: 'O código do nome já está em uso por outro usuário.' });
        }
      }

      const updateData = {
        name,
        email,
        role,
        nameCode,
      };

      if (password) {
        updateData.password = await bcrypt.hash(password, 10);
      }

      const [updated] = await db.User.update(
        updateData,
        { where: { id } }
      );

      if (updated) {
        const updatedUser = await db.User.findByPk(id);
        const { password: _, ...userWithoutPassword } = updatedUser.toJSON();
        return res.status(200).json(userWithoutPassword);
      }
      return res.status(404).json({ message: 'Usuário não encontrado para atualização.' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar o usuário!', details: error.message });
    }
  },

  async updateTeacher(req, res) {
    const { id } = req.params;
    const { name, email, password, nameCode } = req.body;

    if (!name && !email && !password && !nameCode) {
      return res.status(400).json({ error: 'Pelo menos um campo deve ser fornecido para atualização.' });
    }

    if ([name, email, password, nameCode].some(field => field && typeof field === 'string' && field.trim() === '')) {
      return res.status(400).json({ error: 'Nenhum campo pode ser vazio.' });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: 'O email fornecido não é válido.' });
    }

    try {
      const teacher = await db.User.findOne({ where: { id, role: 'professor' } });
      if (!teacher) {
        return res.status(404).json({ error: 'Professor não encontrado.' });
      }

      if (email && email !== teacher.email) {
        const existingUserByEmail = await db.User.findOne({ where: { email } });
        if (existingUserByEmail) {
          return res.status(409).json({ error: 'Este email já está em uso.' });
        }
      }

      if (nameCode && nameCode !== teacher.nameCode) {
        const existingUserByNameCode = await db.User.findOne({ where: { nameCode } });
        if (existingUserByNameCode) {
          return res.status(409).json({ error: 'O código do nome já está em uso.' });
        }
      }

      const updatedData = {};
      if (name) updatedData.name = name;
      if (email) updatedData.email = email;
      if (password) updatedData.password = await bcrypt.hash(password, 10);
      if (nameCode) updatedData.nameCode = nameCode;

      await db.User.update(updatedData, { where: { id } });

      const updatedTeacher = await db.User.findOne({ where: { id } });
      res.status(200).json(updatedTeacher);
    } catch (error) {
      console.error('Error in updateTeacher:', error);
      res.status(500).json({ error: 'Erro ao atualizar o professor!', details: error.message });
    }
  },

  async viewAllUsers(req, res) {
    try {
      const users = await db.User.findAll({
        order: [['name', 'ASC']]
      });
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar usuários', details: error.message });
    }
  },

  async getUserById(req, res) {
    const { id } = req.params;
    try {
      const user = await db.User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado!' });
      }
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar o usuário', details: error.message });
    }
  },

  async deleteUser(req, res) {
    const { id } = req.params;
    try {
      await db.Course.destroy({ where: { userId: id } });

      const user = await db.User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado!' });
      }

      await user.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erro ao deletar o usuário', details: error.message });
    }
  },

  async deleteTeacher(req, res) {
    try {
      const { id } = req.params;

      const teacher = await db.User.findOne({
        where: {
          id,
          role: 'professor'
        }
      });

      if (!teacher) {
        return res.status(404).json({ error: 'Professor não encontrado.' });
      }

      await teacher.destroy();
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Erro ao excluir o professor', details: error.message });
    }
  },

  // Visualizar horário acadêmico individual do professor
  async getProfessorSchedule(req, res) {
    const { id } = req.params;

    try {
      const professor = await db.User.findByPk(id);
      if (!professor || professor.role !== 'Professor') {
        return res.status(404).json({ error: 'Professor não encontrado.' });
      }

      const hourGrids = await db.HourGrid.findAll({
        where: {
          userId: id,
          publicated: true,
        },
        include: [
          {
            model: db.Discipline,
            as: 'discipline',
            required: true,
            attributes: ['id', 'name', 'code'],
          },
          {
            model: db.User,
            as: 'teacher',
            required: true,
            attributes: ['id', 'name', 'nameCode'],
          },
          {
            model: db.Semester,
            as: 'semester',
            required: true,
            attributes: ['id', 'number'],
            include: [
              {
                model: db.Course,
                as: 'courses',
                required: true,
                attributes: ['id', 'name', 'code'],
                include: [
                  {
                    model: db.Classes,
                    as: 'classes',
                    required: true,
                    attributes: ['id', 'code'],
                    where: {
                      active: true,
                      semester: [db.Sequelize.col('semester.number')],
                    },
                    include: [
                      {
                        model: db.Turn,
                        as: 'turn',
                        required: true,
                        attributes: ['name'],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            model: db.DayOfWeek,
            as: 'day',
            required: true,
            attributes: ['id', 'name'],
          },
          {
            model: db.Hours,
            as: 'hour',
            required: true,
            attributes: ['id', 'hourStart', 'hourEnd', 'turnId'],
          },
          {
            model: db.Calendar,
            as: 'calendar',
            required: true,
            attributes: ['id', 'name'],
          },
        ],
        order: [['dayId', 'ASC'], ['hourId', 'ASC']],
      });

      if (!hourGrids || hourGrids.length === 0) {
        return res.status(404).json({
          error: 'Nenhum horário encontrado para este professor.',
        });
      }

      const semestersMap = new Map();
      hourGrids.forEach((hour) => {
        const semesterId = hour.semesterId || null;
        const semesterNumber = hour.semester ? hour.semester.number : null;
        const courseId = hour.semester?.courses[0]?.id || null;
        const classData = hour.semester?.courses[0]?.classes[0] || {};
        const semesterKey = semesterId || 'null';

        if (!semestersMap.has(semesterKey)) {
          semestersMap.set(semesterKey, {
            semesterId,
            semesterNumber,
            classId: classData.id || null,
            classCode: classData.code || '',
            courseId,
            courseName: hour.semester?.courses[0]?.name || null,
            assignments: [],
          });
        }

        const semester = semestersMap.get(semesterKey);
        semester.assignments.push({
          disciplineId: hour.discipline.id,
          disciplineName: hour.discipline.name,
          disciplineCode: hour.discipline.code,
          professorId: hour.teacher.id,
          professorName: hour.teacher.name,
          professorNameCode: hour.teacher.nameCode,
          day: hour.day.name,
          time: {
            id: hour.hour.id,
            hourStart: hour.hour.hourStart,
            hourEnd: hour.hour.hourEnd,
            turnId: hour.hour.turnId,
          },
        });
      });

      const formattedResponse = {
        data: Array.from(semestersMap.values()),
      };
      return res.status(200).json(formattedResponse);
    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao buscar horário do professor.',
        details: error.message,
      });
    }
  },

  // Buscar planejamento docente por curso
  async getTeachingPlanByCourse(req, res) {
    const { coordinatorId, calendarId } = req.params;

    const courseFound = await db.Course.findOne({
      where: { coordinationId: coordinatorId }
    });

    if (!courseFound) {
      return res.status(404).json({
        message: 'Curso não encontrado para este coordenador.'
      });
    }

    try {
      const hourGrids = await db.HourGrid.findAll({
        where: { courseId: courseFound.id, calendarId },
        include: [
          { model: db.Discipline, as: 'discipline', required: true, attributes: ['id', 'name', 'code'] },
          {
            model: db.User,
            as: 'teacher',
            required: true,
            attributes: ['id', 'name', 'nameCode'],
            include: [
              { model: db.DayOfWeek, as: 'prefsDays', attributes: ['id', 'name'], through: { attributes: ['observation'] } }
            ]
          },
          {
            model: db.Semester,
            as: 'semester',
            required: true,
            attributes: ['id', 'number'],
            include: [
              {
                model: db.Course,
                as: 'courses',
                required: true,
                attributes: ['id', 'name', 'code'],
                include: [
                  {
                    model: db.Classes,
                    as: 'classes',
                    required: true,
                    attributes: ['id', 'code'],
                    where: { active: true, semester: [db.Sequelize.col('semester.number')] },
                    include: [{ model: db.Turn, as: 'turn', required: true, attributes: ['name'] }]
                  }
                ]
              }
            ]
          },
          { model: db.DayOfWeek, as: 'day', required: true, attributes: ['id', 'name'] },
          { model: db.Hours, as: 'hour', required: true, attributes: ['id', 'hourStart', 'hourEnd', 'turnId'] },
          { model: db.Calendar, as: 'calendar', required: true, attributes: ['id', 'name'] },
        ],
        order: [['dayId', 'ASC'], ['hourId', 'ASC']],
      });

      if (!hourGrids || hourGrids.length === 0) {
        return res.status(404).json({
          message: 'Nenhum planejamento docente encontrado para este curso.',
        });
      }

      // =========================
      // Agrupamento específico por classId
      // =========================
      const coursesMap = {};

      hourGrids.forEach(hour => {
        const courseList = hour.semester?.courses || [];
        if (!courseList.length) return;

        // encontra a turma correta pelo classId da aula
        let foundCourse, foundClass;
        for (const course of courseList) {
          const cls = course.classes.find(c => c.id === hour.classId);
          if (cls) {
            foundCourse = course;
            foundClass = cls;
            break;
          }
        }
        if (!foundCourse || !foundClass) return;

        // inicializa o curso
        if (!coursesMap[foundCourse.id]) {
          coursesMap[foundCourse.id] = {
            id: foundCourse.id,
            name: foundCourse.name,
            code: foundCourse.code,
            classes: {}
          };
        }

        // inicializa a turma
        if (!coursesMap[foundCourse.id].classes[foundClass.id]) {
          coursesMap[foundCourse.id].classes[foundClass.id] = {
            id: foundClass.id,
            code: foundClass.code,
            turn: foundClass.turn?.name || '',
            lessons: []
          };
        }

        // adiciona a aula na turma correta
        coursesMap[foundCourse.id].classes[foundClass.id].lessons.push({
          id: hour.id,
          discipline: hour.discipline,
          teacher: hour.teacher,
          day: hour.day,
          hour: hour.hour,
          calendar: hour.calendar,
          active: hour.active,
          publicated: hour.publicated
        });
      });

      // transforma o mapa em array
      const courses = Object.values(coursesMap).map(course => ({
        id: course.id,
        name: course.name,
        code: course.code,
        classes: Object.values(course.classes)
      }));

      return res.status(200).json({ courses });

    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao buscar planejamento docente.',
        details: error.message,
      });
    }
  }

};

export default UserController;