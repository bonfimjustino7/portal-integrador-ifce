'use strict';
const fs = require('fs');
const { parse } = require('csv-parse/sync');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const csvFilePath = '../server/data/horarios_2025_2.csv';
    let fileContent;

    // Ler o arquivo CSV
    try {
      fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
      fileContent = fileContent.trimStart();
      console.log('--- Conteúdo do arquivo CSV lido (primeiras 200 chars):');
      console.log(fileContent.substring(0, 200));
    } catch (error) {
      console.error('--- ERRO: Não foi possível ler o arquivo CSV. Verifique o caminho:', error.message);
      return;
    }

    // Parsear o CSV
    let records = [];
    try {
      records = parse(fileContent, {
        columns: ['code', 'disciplineId', 'userId', 'dayId', 'hourId', 'turnId', 'calendarId'],
        skip_empty_lines: true,
        skip_lines_with_error: true,
        skip_lines_with_empty_values: true,
        delimiter: ',',
        trim: true,
        quote: '"',
        relax_column_count: true,
        from_line: 2 // Pula a primeira linha (cabeçalho)
      });
      console.log(`--- Número de registros parsados do CSV: ${records.length}`);
      if (records.length > 0) {
        console.log('--- Primeiro registro parsado do CSV:', records[0]);
      }
    } catch (parseError) {
      console.error('--- ERRO: Não foi possível parsear o CSV:', parseError.message);
      return;
    }

    const hourGridToInsert = [];

    for (const record of records) {
      const { code, disciplineId, userId, dayId, hourId, calendarId } = record;

      // Validar dados do CSV
      if (!code || !disciplineId || !userId || !dayId || !hourId || !calendarId) {
        console.warn(`--- Registro ignorado devido a dados incompletos:`, record);
        continue;
      }

      // Validar userId na tabela users
      let userRecord;
      try {
        userRecord = await queryInterface.sequelize.query(
          `SELECT id FROM users WHERE id = :userId`,
          {
            replacements: { userId: parseInt(userId, 10) },
            type: queryInterface.sequelize.QueryTypes.SELECT
          }
        );
        if (!userRecord || userRecord.length === 0) {
          console.warn(`--- userId ${userId} não encontrado na tabela users para o código: ${code}`);
          continue;
        }
      } catch (error) {
        console.error(`--- ERRO ao consultar userId ${userId}:`, error.message);
        continue;
      }

      // Extrair o número do semestre do código da turma (ex.: 'S2' → 2)
      const semesterMatch = code.match(/S(\d+)/);
      if (!semesterMatch) {
        console.warn(`--- Formato de semestre inválido no código da turma: ${code}`);
        continue;
      }
      const semesterNumber = parseInt(semesterMatch[1], 10);

      // Consultar a tabela 'classes' para obter o courseId e classId
      let classRecord;
      try {
        classRecord = await queryInterface.sequelize.query(
          `SELECT id, courseId FROM classes WHERE code = :code`,
          {
            replacements: { code },
            type: queryInterface.sequelize.QueryTypes.SELECT
          }
        );
        if (!classRecord || classRecord.length === 0) {
          console.warn(`--- Turma não encontrada para o código: ${code}`);
          continue;
        }
      } catch (error) {
        console.error(`--- ERRO ao consultar turma para o código ${code}:`, error.message);
        continue;
      }

      const courseId = classRecord[0].courseId;
      const classId = classRecord[0].id;

      // Consultar a tabela 'course_semester' para obter os semestres associados ao curso
      let courseSemesters;
      try {
        courseSemesters = await queryInterface.sequelize.query(
          `SELECT semesterId FROM course_semester WHERE courseId = :courseId`,
          {
            replacements: { courseId },
            type: queryInterface.sequelize.QueryTypes.SELECT
          }
        );
        if (!courseSemesters || courseSemesters.length === 0) {
          console.warn(`--- Nenhum semestre encontrado para o cursoId: ${courseId}`);
          continue;
        }
      } catch (error) {
        console.error(`--- ERRO ao consultar course_semester para courseId ${courseId}:`, error.message);
        continue;
      }

      // Consultar a tabela 'semesters' para encontrar o semesterId correspondente ao semesterNumber
      let semesterId = null;
      for (const { semesterId: csSemesterId } of courseSemesters) {
        try {
          const semesterRecords = await queryInterface.sequelize.query(
            `SELECT id, number FROM semesters WHERE id = :semesterId`,
            {
              replacements: { semesterId: csSemesterId },
              type: queryInterface.sequelize.QueryTypes.SELECT
            }
          );
          if (semesterRecords && semesterRecords.length > 0) {
            const semester = semesterRecords[0];
            if (semester.number === semesterNumber) {
              semesterId = semester.id;
              break;
            }
          }
        } catch (error) {
          console.error(`--- ERRO ao consultar semester para semesterId ${csSemesterId}:`, error.message);
        }
      }

      if (!semesterId) {
        console.warn(`--- Semestre ${semesterNumber} não encontrado para courseId ${courseId} no código ${code}`);
        continue;
      }

      // Adicionar registro à lista para inserção
      hourGridToInsert.push({
        disciplineId: parseInt(disciplineId, 10),
        userId: parseInt(userId, 10),
        dayId: parseInt(dayId, 10),
        hourId: parseInt(hourId, 10),
        semesterId,
        courseId,
        classId, // Adicionado
        calendarId: parseInt(calendarId, 10),
        createdAt: new Date(),
        updatedAt: new Date(),
        active: 1,
        publicated: 1
      });
    }

    console.log(`--- Total de registros a serem inseridos na tabela hour_grid: ${hourGridToInsert.length}`);
    if (hourGridToInsert.length > 0) {
      console.log('--- Exemplo de registro a ser inserido:', hourGridToInsert[0]);
    } else {
      console.log('--- Nenhum registro válido para inserção na tabela hour_grid.');
    }

    // Inserir os registros na tabela hour_grid
    try {
      if (hourGridToInsert.length > 0) {
        await queryInterface.bulkInsert('hour_grid', hourGridToInsert, {});
        console.log('--- Inserção de registros na tabela hour_grid concluída.');
      } else {
        console.log('--- Nenhum registro para inserir na tabela hour_grid.');
      }
    } catch (error) {
      console.error('--- ERRO na inserção em massa na tabela hour_grid:', error.message);
      if (error.errors) {
        error.errors.forEach(err => console.error(`  - Validação falhou para '${err.path}': ${err.message}`));
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('hour_grid', null, {});
    console.log('--- Limpeza de registros da tabela hour_grid concluída.');
  }
};