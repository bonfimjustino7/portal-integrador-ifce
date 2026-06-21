'use strict';
const bcrypt = require('bcrypt');
const fs = require('fs');
const { parse } = require('csv-parse/sync');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const password = await bcrypt.hash('123456', 10);
    const usersToInsert = [];

    const csvFilePath = require('path').join(__dirname, '..', 'data', 'CDU193ListagemdeProfessores_1_1.csv');

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

    const lines = fileContent.split(/\r?\n/);
    let processedLines = [];

    for (const line of lines) {
      if (line.trim() === '') continue;

      // Ignorar a linha de cabeçalho
      if (line.match(/"Nome"[\t ]*,[\t ]*"email"/)) continue;

      const match = line.match(/"([^"]*?)"[\t ]*,[\t ]*"([^"]*?)"/);

      if (match && match.length >= 3) {
        processedLines.push(`"${match[1]}","${match[2]}"`);
      } else {
        console.warn(`Linha não corresponde ao formato esperado (ignorada): ${line}`);
      }
    }
    fileContent = processedLines.join('\n');

    console.log('--- Conteúdo do CSV após pré-processamento (primeiras 200 chars):');
    console.log(fileContent.substring(0, 200));

    let records = [];
    try {
      records = parse(fileContent, {
        columns: ['Nome', 'email'],
        skip_empty_lines: true,
        delimiter: ',',
        trim: true,
        quote: '"',
        relax_column_count: true
      });
      console.log(`--- Número de registros parsados do CSV: ${records.length}`);
      if (records.length > 0) {
        console.log('--- Primeiro registro parsado do CSV:', records[0]);
      }
    } catch (parseError) {
      console.error('--- ERRO: Não foi possível parsear o CSV:', parseError.message);
      return;
    }

    usersToInsert.push(
      {
        name: 'Admin',
        email: 'admin.demo@ifce.edu.br',
        password: password,
        role: 'Admin',
        nameCode: 'Admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Diretor de Ensino',
        email: 'diren.demo@ifce.edu.br',
        password: password,
        role: 'Diretor Ensino',
        nameCode: 'DIR',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação Sistemas de Informação',
        email: 'coordenador.demo@ifce.edu.br',
        password: password,
        role: 'Coordenador',
        nameCode: 'CBSI',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação Engenharia Elétrica',
        email: 'coordenacaoee@email.com',
        password: password,
        role: 'Coordenador',
        nameCode: 'CBEE',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação Engenharia Mecânica',
        email: 'coordenacaoem@email.com',
        password: password,
        role: 'Coordenador',
        nameCode: 'CBEM',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação Mecatrônica Industrial',
        email: 'coordenacaomecatronica@email.com',
        password: password,
        role: 'Coordenador',
        nameCode: 'CTMI',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação Especialização Docência',
        email: 'coordenacaodocencia@email.com',
        password: password,
        role: 'Coordenador',
        nameCode: 'CPDES',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação Licenciatura Matemática',
        email: 'coordenacaomatematica@email.com',
        password: password,
        role: 'Coordenador',
        nameCode: 'CLMT',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação Licenciatura Física',
        email: 'coordenacaofisica@email.com',
        password: password,
        role: 'Coordenador',
        nameCode: 'CLFS',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação Integrado Eletrotécnica',
        email: 'coordenacaointeletro@email.com',
        password: password,
        role: 'Coordenador',
        nameCode: 'CIET',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação Concomitante Eletrotécnica',
        email: 'coordenacaocomeletro@email.com',
        password: password,
        role: 'Coordenador',
        nameCode: 'CCET',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação Subsequente Eletrotécnica',
        email: 'coordenacaosubeletro@email.com',
        password: password,
        role: 'Coordenador',
        nameCode: 'CSET',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação Informática',
        email: 'coordenacaoinfo@email.com',
        password: password,
        role: 'Coordenador',
        nameCode: 'CIIF',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação Integrado Mecânica Industrial',
        email: 'coordenacaointmecindustrial@email.com',
        password: password,
        role: 'Coordenador',
        nameCode: 'CIMI',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação Concomitante Mecânica Industrial',
        email: 'coordenacaocommecindustrial@email.com',
        password: password,
        role: 'Coordenador',
        nameCode: 'CCMI',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação Subsequente Mecânica Industrial',
        email: 'coordenacaosubmecindustrial@email.com',
        password: password,
        role: 'Coordenador',
        nameCode: 'CSMI',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação Administração',
        email: 'coordenacaoadm@email.com',
        password: password,
        role: 'Coordenador',
        nameCode: 'CSAD',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Coordenação EJA',
        email: 'coordenacaoeja@email.com',
        password: password,
        role: 'Coordenador',
        nameCode: 'CEJA',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Professor Demo',
        email: 'professor.demo@ifce.edu.br',
        password: password,
        role: 'Professor',
        nameCode: 'PDEMO',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    );

    const initialUserCount = usersToInsert.length;

    const existingNameCodes = new Set(usersToInsert.map(u => u.nameCode.toUpperCase()));
    const existingEmails = new Set(usersToInsert.map(u => u.email.toLowerCase()));

    function generateUniqueNameCode(nameParts, currentExistingNameCodes) {
      let baseNameCode = '';
      let generatedCode = '';
      let attempt = 0;

      const generateInitialCode = (parts) => {
        if (parts.length >= 3) {
          return parts[0][0] + parts[1][0] + parts[2][0];
        } else if (parts.length === 2) {
          return parts[0][0] + parts[1].substring(0, 2);
        } else if (parts.length === 1) {
          return parts[0].substring(0, 3);
        }
        return '';
      };

      while (true) {
        if (attempt === 0) {
          baseNameCode = generateInitialCode(nameParts);
        } else if (nameParts.length >= 3) {
          if (attempt === 1 && nameParts[1].length > 1) {
            baseNameCode = nameParts[0][0] + nameParts[1][1] + nameParts[2][0];
          } else if (attempt === 2 && nameParts[2].length > 1) {
            baseNameCode = nameParts[0][0] + nameParts[1][0] + nameParts[2][1];
          } else if (attempt === 3 && nameParts[1].length > 1 && nameParts[2].length > 1) {
            baseNameCode = nameParts[0][0] + nameParts[1][1] + nameParts[2][1];
          } else {
            baseNameCode = generateInitialCode(nameParts) + attempt;
          }
        } else if (nameParts.length === 2) {
          if (attempt === 1 && nameParts[1].length > 2) {
            baseNameCode = nameParts[0][0] + nameParts[1].substring(0, 3);
          } else {
            baseNameCode = generateInitialCode(nameParts) + attempt;
          }
        } else {
          baseNameCode = generateInitialCode(nameParts) + attempt;
        }

        generatedCode = baseNameCode.toUpperCase();

        if (!currentExistingNameCodes.has(generatedCode)) {
          return generatedCode;
        }
        attempt++;

        if (attempt > 100) {
          console.warn(`Não foi possível gerar um nameCode único para ${nameParts.join(' ')} após ${attempt} tentativas. Usando fallback com timestamp.`);
          return `NAME${Date.now()}`;
        }
      }
    }

    for (const record of records) {
      const name = record['Nome'];
      const email = record['email'] || ''; // Usa email do CSV ou vazio se não houver

      if (!name || name.trim() === '') {
        console.warn('Registro ignorado devido a nome vazio no CSV:', record);
        continue;
      }

      const cleanedName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const nameParts = cleanedName.split(' ').filter(part => part.length > 0);

      const syntheticDocenteEmailMatch = email.match(/^docente(\d{3})@ifce\.edu\.br$/);
            const uniqueNameCode = syntheticDocenteEmailMatch
              ? `DOC${syntheticDocenteEmailMatch[1]}`
              : generateUniqueNameCode(nameParts, existingNameCodes);
      existingNameCodes.add(uniqueNameCode);

      // Adiciona o email do CSV diretamente, sem gerar um novo
      existingEmails.add(email.toLowerCase());

      usersToInsert.push({
        name: cleanedName,
        email: email,
        password: password,
        role: 'Professor',
        nameCode: uniqueNameCode,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    console.log(`--- Total de usuários a serem inseridos (incluindo CSV): ${usersToInsert.length}`);
    console.log(`--- Exemplo de usuário do CSV (se houver):`);
    if (usersToInsert.length > initialUserCount) {
      console.log(usersToInsert[initialUserCount]);
    } else {
      console.log('--- Nenhum usuário do CSV foi adicionado ao array.');
    }

    try {
      await queryInterface.bulkInsert('users', usersToInsert, {});
      console.log('--- Inserção de usuários concluída.');
    } catch (error) {
      console.error('--- ERRO na inserção em massa:', error.message);
      if (error.errors) {
        error.errors.forEach(err => console.error(`  - Validação falhou para '${err.path}': ${err.message}`));
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
    console.log('--- Limpeza de usuários concluída.');
  }
};