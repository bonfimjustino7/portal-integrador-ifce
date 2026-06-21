'use strict';
const fs = require('fs');
const { parse } = require('csv-parse/sync');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const csvFilePath = './data/horarios_2025_2.csv';
    let fileContent;

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
        columns: ['turnId', 'code', 'disciplineId','userId', 'dayId', 'hourId', 'calendarId'],
        skip_empty_lines: true,
        skip_lines_with_error: true,
        skip_lines_with_empty_values: true,
        delimiter: ',',
        trim: true,
        quote: '"',
        from_line: 2
      });
      console.log(`--- Número de registros parsados do CSV: ${records.length}`);
      if (records.length > 0) {
        console.log('--- Primeiro registro parsado do CSV:', records[0]);
      }
    } catch (parseError) {
      console.error('--- ERRO: Não foi possível parsear o CSV:', parseError.message);
      return;
    }

    const transaction = await queryInterface.sequelize.transaction();

    try {
      const uniquePreferences = new Map();
      for (const record of records) {
        const { userId, disciplineId, code } = record;

        if (!userId || !disciplineId||!code) {
          console.warn(`--- Registro ignorado devido a dados incompletos:`, record);
          continue;
        }

        const userIdInt = parseInt(userId, 10);
        const disciplineIdInt = parseInt(disciplineId, 10);

        const semester = await queryInterface.sequelize.query(
          `select sc.semesterId from classes c join semester_class sc on c.id=sc.classId where c.code like :code`,
          {
            replacements: { code },
            type: queryInterface.sequelize.QueryTypes.SELECT,
            transaction
          }
        );
        if (!semester || semester.length === 0) {
          console.warn(`--- semestre não encontrado na tabela para o registro ${code}:`, record);
          continue;
        }

        const userRecord = await queryInterface.sequelize.query(
          `SELECT id FROM users WHERE id = :userId`,
          {
            replacements: { userId: userIdInt },
            type: queryInterface.sequelize.QueryTypes.SELECT,
            transaction
          }
        );
        if (!userRecord || userRecord.length === 0) {
          console.warn(`--- userId ${userIdInt} não encontrado na tabela users para o registro:`, record);
          continue;
        }

        const disciplineRecord = await queryInterface.sequelize.query(
          `SELECT id FROM disciplines WHERE id = :disciplineId`,
          {
            replacements: { disciplineId: disciplineIdInt },
            type: queryInterface.sequelize.QueryTypes.SELECT,
            transaction
          }
        );
        if (!disciplineRecord || disciplineRecord.length === 0) {
          console.warn(`--- disciplineId ${disciplineIdInt} não encontrado na tabela discipline para o registro:`, record);
          continue;
        }

        const key = `${userIdInt}-${disciplineIdInt}-${semester[0].semesterId}`;
        if (!uniquePreferences.has(key)) {
          uniquePreferences.set(key, {
            userId: userIdInt,
            disciplineId: disciplineIdInt,
            semesterId: semester[0].semesterId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      const preferencesToInsert = Array.from(uniquePreferences.values());

      console.log(`--- Total de registros a serem inseridos na tabela preferencesdiscipline: ${preferencesToInsert.length}`);
      if (preferencesToInsert.length > 0) {
        console.log('--- Exemplo de registro a ser inserido:', preferencesToInsert[0]);
      } else {
        console.log('--- Nenhum registro válido para inserção na tabela preferencesdiscipline.');
      }

      if (preferencesToInsert.length > 0) {
        await queryInterface.bulkInsert('preferencesDiscipline', preferencesToInsert, { transaction });
        console.log('--- Inserção de registros na tabela preferencesdiscipline concluída.');
      } else {
        console.log('--- Nenhum registro para inserir na tabela preferencesdiscipline.');
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('--- ERRO na seed:', error.message);
      if (error.errors) {
        error.errors.forEach(err => console.error(`  - Validação falhou para "${err.path}": ${err.message}`));
      }
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkDelete('preferencesDiscipline', null, { transaction });
      console.log('--- Limpeza de registros da tabela preferencesdiscipline concluída.');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('--- ERRO na exclusão da tabela preferencesdiscipline:', error.message);
      throw error;
    }
  }
};
