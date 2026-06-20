const MetricsData = {
    getM1() {
        const M1 = [
            {
                name: "Taxa de Conflitos",
                form: "conflitos/conflitos_totais",
                description: "Porcentagem de alocações com conflitos",
                result: null
            },
            {
                name: "Número Total de Conflitos",
                form: "reportConflicts(timetable).length",
                description: "Quantidade total de conflitos detectados",
                result: null
            },
            {
                name: "Soluções Válidas",
                form: "vlidas/total_turmas",
                description: "Porcentagem se turmas sem conflitos",
                result: null
            },
            {
                name: "Taxa de Cobertura de Sessões",
                form: "alocadas/requeridas",
                description: "Verificar se todas as aulas foram alocadas",
                result: null
            },
        ];
        return M1;
    },

    getM2() {
        const M2 = [
            {
                name: "Fitness Médio",
                form: "conflitos/conflitos_totais",
                description: "Porcentagem de alocações com conflitos",
                result: null
            },
            {
                name: "Fitness Máximo",
                form: "max(fitness)",
                description: "Melhor solução encontrada",
                result: null
            },
            {
                name: "Desvio Padrão do Fitness",
                form: "sigma(fitness)",
                description: "Estabilidade entre turmas",
                result: null
            },
            {
                name: "Índice de Consecutividade",
                form: "pares_consecutivos/t_pares_possíveis",
                description: "Agrupamento de aulas consecutivas",
                result: null
            },
            {
                name: "Balanceamento de Carga",
                form: "desvio_padrãoh_por_professor",
                description: "Equilíbrio entre professores ",
                result: null
            },
            {
                name: "Uso de Slots ",
                form: "slots_usados/slots_disponíveis",
                description: "Eficiência do calendário",
                result: null
            },
        ];
        return M2;
    },

    getM3() {
        const M3 = [
            {
                name: "Tempo de Execução Total ",
                form: "console.time('generateHour')",
                description: "Tempo necessário para gerar o horário completo",
                result: null
            },
            {
                name: "Iterações até Convergência",
                form: "Contagem de iterações até estabilização do bestFitness",
                description: "Número de ciclos até não haver melhora significativa",
                result: null
            },
            {
                name: "Taxa de Melhoria",
                description: "Delta fitness/ iteração",
                form: "Velocidade média de melhoria do algoritmo ",
                result: null
            },
            {
                name: "Uso de Memória",
                form: "process.memoryUsage()",
                description: "Quantidade de memória utilizada durante a execução",
                result: null
            },
            {
                name: "Número de Evoluções",
                form: "geneticalgorithm.evolve() chamadas ",
                description: "Total de ciclos de evolução executados",
                result: null
            },
        ];

        return M3;
    },

    getM4() {
        const M4 = [
            {
                name: "Curva de Convergência",
                form: "fitness[iteração] → gráfico",
                description: "Avalia como o fitness evolui ao longo das iterações",
                result: null
            },
            {
                name: "Estagnação",
                form: "N° de iterações sem melhora > 500",
                description: "Identifica quando o algoritmo deixa de evoluir",
                result: null
            },
            {
                name: "Diversidade da População",
                description: "desvio_padrão(fitness_população)",
                form: "Mede a variabilidade entre indivíduos da população",
                result: null
            },
            {
                name: "Taxa de Mutação Efetiva",
                form: "% de mutações que melhoram o fitness",
                description: "Eficiência das mutações na evolução da solução",
                result: null
            },
        ];

        return M4;
    }
}

export default MetricsData;