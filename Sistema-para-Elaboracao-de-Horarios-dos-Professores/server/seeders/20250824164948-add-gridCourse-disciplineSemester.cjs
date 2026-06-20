'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Iniciar uma transação
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // Consultar a tabela grid-course
      const [grids] = await queryInterface.sequelize.query(
        'SELECT id, courseId FROM `grid-course` ORDER BY id ASC',
        { transaction }
      );

      console.log('--- Grids encontrados:', grids);

      // Consultar a tabela discipline_semester
      const [disciplinesSemesters] = await queryInterface.sequelize.query(
        'SELECT id, courseId FROM `discipline_semester` ORDER BY id ASC',
        { transaction }
      );

      console.log('--- DisciplineSemesters encontrados:', disciplinesSemesters);

      const gridCourseDisciplineSemesters = [];

      // Criar associações entre gridCourseId e disciplineSemesterId
      for (const ds of disciplinesSemesters) {
        const matchingGrids = grids.filter(grid => grid.courseId === ds.courseId);

        for (const grid of matchingGrids) {
          gridCourseDisciplineSemesters.push({
            gridCourseId: grid.id,
            disciplineSemesterId: ds.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      // Inserir registros na tabela gridcourse-disciplinesemester
      if (gridCourseDisciplineSemesters.length > 0) {
        console.log(`--- Total de registros a serem inseridos na tabela gridcourse-disciplinesemester: ${gridCourseDisciplineSemesters.length}`);
        console.log('--- Exemplo de registro a ser inserido:', gridCourseDisciplineSemesters[0]);

        await queryInterface.bulkInsert(
          'gridCourse-disciplineSemester',
          gridCourseDisciplineSemesters,
          { transaction }
        );
        console.log('--- Inserção de registros na tabela gridcourse-disciplinesemester concluída.');
      } else {
        console.log('--- Nenhum registro para inserir na tabela gridcourse-disciplinesemester.');
      }

      // Confirmar a transação
      await transaction.commit();
    } catch (error) {
      // Reverter a transação em caso de erro
      await transaction.rollback();
      console.error('--- ERRO na seed:', error.message);
      if (error.errors) {
        error.errors.forEach(err => console.error(`  - Validação falhou para '${err.path}': ${err.message}`));
      }
      throw error; // Propagar o erro para falhar a migration
    }
  },

  async down(queryInterface, Sequelize) {
    // Iniciar uma transação para a operação de exclusão
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.bulkDelete('gridCourse-disciplineSemester', null, { transaction });
      console.log('--- Limpeza de registros da tabela gridcourse-disciplinesemester concluída.');
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('--- ERRO na exclusão da tabela gridcourse-disciplinesemester:', error.message);
      throw error;
    }
  }
};