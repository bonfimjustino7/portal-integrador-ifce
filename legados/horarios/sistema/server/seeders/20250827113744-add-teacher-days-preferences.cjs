'use strict';
const fs = require('fs');
const { parse } = require('csv-parse/sync');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const csvFilePath = './data/horarios_2025_2.csv';
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
        columns: ['turnId', 'code', 'disciplineId','userId', 'hourId','dayId', 'calendarId'],
        skip_empty_lines: true,
        skip_lines_with_error: true,
        skip_lines_with_empty_values: true,
        delimiter: ',',
        trim: true,
        quote: '"',
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

    // Iniciar uma transação
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Mapear dias únicos por userId
      const userDaysMap = new Map();
      for (const record of records) {
        const { userId, dayId } = record;

        // Validar dados do CSV
        if (!userId || !dayId) {
          console.warn(`--- Registro ignorado devido a dados incompletos:`, record);
          continue;
        }

        const userIdInt = parseInt(userId, 10);
        const dayIdInt = parseInt(dayId, 10);

        // Validar userId na tabela users
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

        // Validar dayId na tabela day
        const dayRecord = await queryInterface.sequelize.query(
          `SELECT id FROM dayOfWeek WHERE id = :dayId`,
          {
            replacements: { dayId: dayIdInt },
            type: queryInterface.sequelize.QueryTypes.SELECT,
            transaction
          }
        );
        if (!dayRecord || dayRecord.length === 0) {
          console.warn(`--- dayId ${dayIdInt} não encontrado na tabela day para o registro:`, record);
          continue;
        }

        // Adicionar dayId ao conjunto de dias para o userId
        if (!userDaysMap.has(userIdInt)) {
          userDaysMap.set(userIdInt, new Set());
        }
        userDaysMap.get(userIdInt).add(dayIdInt);
      }

      // Criar registros para inserção
      const preferencesToInsert = [];
      for (const [userId, dayIds] of userDaysMap) {
        for (const dayId of dayIds) {
          preferencesToInsert.push({
            userId,
            dayId,
            createdAt: new Date(),
            updatedAt: new Date(),
            observation: null
          });
        }
      }

      console.log(`--- Total de registros a serem inseridos na tabela preferencesday: ${preferencesToInsert.length}`);
      if (preferencesToInsert.length > 0) {
        console.log('--- Exemplo de registro a ser inserido:', preferencesToInsert[0]);
      } else {
        console.log('--- Nenhum registro válido para inserção na tabela preferencesday.');
      }

      // Inserir os registros na tabela preferencesday
      if (preferencesToInsert.length > 0) {
        await queryInterface.bulkInsert('preferencesDay', preferencesToInsert, { transaction });
        console.log('--- Inserção de registros na tabela preferencesday concluída.');
      } else {
        console.log('--- Nenhum registro para inserir na tabela preferencesday.');
      }

      // Confirmar a transação
      await transaction.commit();
    } catch (error) {
      // Reverter a transação em caso de erro
      await transaction.rollback();
      console.error('--- ERRO na seed:', error.message);
      if (error.errors) {
        error.errors.forEach(err => console.error(`  - Validação falhou para "${err.path}": ${err.message}`));
      }
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Iniciar uma transação para a exclusão
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkDelete('preferencesDay', null, { transaction });
      console.log('--- Limpeza de registros da tabela preferencesday concluída.');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('--- ERRO na exclusão da tabela preferencesday:', error.message);
      throw error;
    }
  }
};
