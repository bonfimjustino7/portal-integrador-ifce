// seeders/xxxx-create-disciplines-from-csv.js
'use strict';
const fs = require('fs');
const { parse } = require('csv-parse/sync');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const disciplinesToInsert = [];
    const existingCodes = new Set(); 

    const csvFilePath = '../server/data/disciplines.csv';

    let fileContent;
    try {
      fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
      console.log('--- Arquivo CSV de disciplinas lido com sucesso.');
    } catch (error) {
      console.error(`--- ERRO: Não foi possível ler o arquivo CSV em ${csvFilePath}. Verifique o caminho.`, error.message);
      fileContent = ''; 
      console.warn('--- A migration continuará sem inserir dados do CSV.');
    }

    if (fileContent.trim() === '') {
        console.log('--- Arquivo CSV está vazio. Nenhuma disciplina para adicionar do arquivo.');
    } else {
        let records = [];
        try {
          records = parse(fileContent, {
            columns: true,          
            skip_empty_lines: true, 
            delimiter: ',',
            trim: true,
          });
          console.log(`--- ${records.length} registros encontrados no CSV.`);
        } catch (parseError) {
          console.error('--- ERRO: Falha ao parsear o conteúdo do CSV:', parseError.message);
          return; 
        }
    
        for (const record of records) {
          const name = record['Nome'];
          const code = record['codigo'];
          const workload = parseInt(record['carga horaria'], 10);
          const credit = parseInt(record['creditos'], 10);
    
          if (!name || !code || isNaN(workload) || isNaN(credit)) {
            console.warn(`--- Registro ignorado por dados inválidos ou ausentes:`, record);
            continue;
          }
    
          disciplinesToInsert.push({
            name,
            code,
            workload,
            credit,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          existingCodes.add(code.toUpperCase());
        }
    
        console.log(`--- Total de ${disciplinesToInsert.length} disciplinas prontas para inserção.`);
    }

    if (disciplinesToInsert.length > 0) {
      try {
        await queryInterface.bulkInsert('disciplines', disciplinesToInsert, {});
        console.log('--- Inserção em massa de disciplinas concluída com sucesso.');
      } catch (error) {
        console.error('--- ERRO na inserção em massa de disciplinas:', error.message);
      }
    } else {
        console.log('--- Nenhuma nova disciplina para inserir.');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('disciplines', null, {});
    console.log('--- Limpeza da tabela de disciplinas concluída.');
  }
};