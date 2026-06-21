'use strict';
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const disciplineSemesterToInsert = [];
    const now = new Date();

    const courseSemesterDisciplineCsvPath = path.join(__dirname, '../data/semester_course_discipline_data.csv');

    let courseSemesterDisciplineFileContent;

    try {
      courseSemesterDisciplineFileContent = fs.readFileSync(courseSemesterDisciplineCsvPath, { encoding: 'utf-8' });
      console.log('--- Arquivo CSV de associações curso-semestre-disciplina lido com sucesso.');
    } catch (error) {
      console.error(`--- ERRO: Não foi possível ler o arquivo CSV em ${courseSemesterDisciplineCsvPath}. Verifique o caminho.`, error.message);
      courseSemesterDisciplineFileContent = '';
      console.warn('--- A migration continuará sem inserir dados do CSV de associações.');
    }

    let courseSemesterDisciplineRecords = [];
    if (courseSemesterDisciplineFileContent.trim() === '') {
      console.log('--- Arquivo CSV de associações está vazio. Nenhuma associação para adicionar.');
    } else {
      try {
        courseSemesterDisciplineRecords = parse(courseSemesterDisciplineFileContent, {
          columns: true,
          skip_empty_lines: true,
          delimiter: ',',
          trim: true,
          relax_column_count: true,
          on_info: (info) => {
            if (info.type === 'column_mismatch') {
              console.warn(`--- AVISO: Inconsistência na contagem de colunas na linha ${info.records}: esperava ${info.expected}, encontrou ${info.actual}. Registro: ${JSON.stringify(info.record)}`);
            }
          }
        });
        console.log(`--- ${courseSemesterDisciplineRecords.length} registros encontrados no CSV de associações.`);
      } catch (parseError) {
        console.error('--- ERRO: Falha ao parsear o conteúdo do CSV de associações:', parseError.message);
        return;
      }
    }

    const teachers = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role = 'professor' ORDER BY id LIMIT 1;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (teachers.length === 0) {
      console.error('--- ERRO: Nenhum professor encontrado no banco de dados. A migração não pode prosseguir.');
      return;
    }
    const defaultTeacherId = teachers[0].id;
    console.log(`--- Usando o professor com ID: ${defaultTeacherId} para todas as associações.`);

    const disciplinesInDb = await queryInterface.sequelize.query(
      `SELECT id, name FROM disciplines;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const disciplineNameToIdMap = new Map();
    for (const discipline of disciplinesInDb) {
      const nameKey = discipline.name ? discipline.name.trim().toLowerCase() : null;
      if (nameKey) {
        disciplineNameToIdMap.set(nameKey, discipline.id);
      }
    }
    console.log(`--- Mapa de nomes de disciplinas para IDs do DB criado com ${disciplineNameToIdMap.size} entradas.`);

    const courseSemestersInDb = await queryInterface.sequelize.query(
      `SELECT cs.courseId, s.number AS semesterNumber, cs.semesterId
       FROM course_semester AS cs
       JOIN semesters AS s ON cs.semesterId = s.id
       ORDER BY cs.courseId, s.number;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const courseSemesterNumberToSemesterIdMap = new Map();
    for (const cs of courseSemestersInDb) {
      const key = `${cs.courseId}-${cs.semesterNumber}`;
      courseSemesterNumberToSemesterIdMap.set(key, cs.semesterId);
    }
    console.log(`--- Mapa de associações curso-semestre para IDs de semestre do DB criado com ${courseSemesterNumberToSemesterIdMap.size} entradas.`);

    for (const record of courseSemesterDisciplineRecords) {
      const csvCourseId = parseInt(record['curso'], 10);
      const csvSemesterNumber = parseInt(record['semestre'], 10);
      const csvDisciplineName = record['disciplina'] ? record['disciplina'].trim().toLowerCase() : null;
      const csvType = record['tipo'] ? record['tipo'].trim() : null;

      if (isNaN(csvCourseId) || isNaN(csvSemesterNumber) || !csvDisciplineName || !csvType) {
        console.warn(`--- Registro CSV ignorado por dados inválidos ou ausentes (curso/semestre/disciplina/type):`, record);
        continue;
      }

      const disciplineId = disciplineNameToIdMap.get(csvDisciplineName);
      if (!disciplineId) {
        console.warn(`--- Disciplina '${csvDisciplineName}' não encontrada na tabela 'disciplines'. Registro ignorado.`, record);
        continue;
      }

      const semesterIdKey = `${csvCourseId}-${csvSemesterNumber}`;
      const semesterId = courseSemesterNumberToSemesterIdMap.get(semesterIdKey);

      if (!semesterId) {
        console.warn(`--- Associação Semestre/Curso ('${csvSemesterNumber}' para Curso ID '${csvCourseId}') não encontrada na tabela 'course_semester'. Registro ignorado.`, record);
        continue;
      }

      disciplineSemesterToInsert.push({
        semesterId: semesterId,
        disciplineId: disciplineId,
        courseId: csvCourseId,
        type: csvType,
        createdAt: now,
        updatedAt: now
      });
    }

    console.log(`--- Total de ${disciplineSemesterToInsert.length} associações disciplina-semestre-curso prontas para inserção.`);

    if (disciplineSemesterToInsert.length > 0) {
      try {
        await queryInterface.bulkInsert('discipline_semester', disciplineSemesterToInsert, {});
        console.log('--- Inserção em massa de associações disciplina-semestre-curso concluída com sucesso.');
      } catch (error) {
        console.error('--- ERRO na inserção em massa de associações disciplina-semestre-curso:', error.message);
      }
    } else {
      console.log('--- Nenhuma nova associação disciplina-semestre-curso para inserir.');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('discipline_semester', null, {});
    console.log('--- Limpeza da tabela de associações disciplina-semestre-curso concluída.');
  }
};