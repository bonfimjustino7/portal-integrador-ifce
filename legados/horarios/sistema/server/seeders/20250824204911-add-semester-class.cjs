'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Iniciar uma transação
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Consultar a tabela classes
      const classes = await queryInterface.sequelize.query(
        'SELECT * FROM classes ORDER BY courseId ASC',
        { type: queryInterface.sequelize.QueryTypes.SELECT, transaction }
      );

      console.log(`--- Total de classes encontradas: ${classes.length}`);
      if (classes.length > 0) {
        console.log('--- Primeiro registro de classes:', classes[0]);
      } else {
        console.log('--- Nenhuma classe encontrada na tabela classes.');
      }

      // Verificar se há classes suficientes
      if (classes.length < 30) {
        console.error(`--- ERRO: Menos de 30 classes encontradas (${classes.length}). Necessário pelo menos 30 para a inserção.`);
        await transaction.rollback();
        return;
      }

      // Preparar registros para inserção
      const semesterClassRecords = [
        { semesterId: 1, classId: classes[0].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 10, classId: classes[1].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 9, classId: classes[2].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 11, classId: classes[3].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 30, classId: classes[4].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 41, classId: classes[5].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 39, classId: classes[6].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 38, classId: classes[7].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 48, classId: classes[8].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 47, classId: classes[9].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 49, classId: classes[10].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 56, classId: classes[11].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 60, classId: classes[12].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 58, classId: classes[13].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 63, classId: classes[14].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 64, classId: classes[15].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 74, classId: classes[16].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 78, classId: classes[17].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 78, classId: classes[18].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 76, classId: classes[19].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 80, classId: classes[20].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 84, classId: classes[21].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 82, classId: classes[22].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 87, classId: classes[23].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 88, classId: classes[24].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 94, classId: classes[25].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 98, classId: classes[26].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 97, classId: classes[27].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 102, classId: classes[28].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
        { semesterId: 100, classId: classes[29].id, createdAt: new Date(), updatedAt: new Date(), planning:1 },
      ];

      console.log(`--- Total de registros a serem inseridos na tabela semester_class: ${semesterClassRecords.length}`);
      console.log('--- Exemplo de registro a ser inserido:', semesterClassRecords[0]);

      // Inserir registros na tabela semester_class
      await queryInterface.bulkInsert('semester_class', semesterClassRecords, { transaction });

      console.log('--- Inserção de registros na tabela semester_class concluída.');

      // Confirmar a transação
      await transaction.commit();
    } catch (error) {
      // Reverter a transação em caso de erro
      await transaction.rollback();
      console.error('--- ERRO na seed:', error.message);
      if (error.errors) {
        error.errors.forEach(err => console.error(`  - Validação falhou para "${err.path}": ${err.message}`));
      }
      throw error; // Propagar o erro para falhar a migration
    }
  },

  async down(queryInterface, Sequelize) {
    // Iniciar uma transação para a operação de exclusão
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkDelete('semester_class', null, { transaction });
      console.log('--- Limpeza de registros da tabela semester_class concluída.');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('--- ERRO na exclusão da tabela semester_class:', error.message);
      throw error;
    }
  }
};