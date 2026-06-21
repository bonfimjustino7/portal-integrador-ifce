import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Chip,
    Box,
    Paper,
    Grid,
    Divider,
} from "@mui/material";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from "recharts";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import MetricsData from "../metrics/metrics";

const COLORS = ["#4caf50", "#f44336"];
const METRIC_GROUPS = {
    M1: { name: "Validade", color: "#d32f2f" },
    M2: { name: "Qualidade", color: "#1976d2" },
    M3: { name: "Desempenho", color: "#7b1fa2" },
    M4: { name: "Convergência", color: "#388e3c" },
};

const MetricsModal = ({ open, onClose, metrics = {}, convergence = [] }) => {
    // Carrega definições das métricas
    if (!metrics || !metrics.M1_Validade || !metrics.M2_Qualidade) {
        return (
            <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ bgcolor: "#2e7d32", color: "white" }}>
                    Carregando Métricas...
                </DialogTitle>
                <DialogContent dividers>
                    <Box textAlign="center" py={8}>
                        <Typography variant="h6" color="text.secondary">
                            Carregando relatório detalhado...
                        </Typography>
                    </Box>
                </DialogContent>
            </Dialog>
        );
    }

    // Se chegou aqui, metrics já tem dados
    console.log("Métricas carregadas no modal:", metrics);
    const M1 = MetricsData.getM1();
    const M2 = MetricsData.getM2();
    const M3 = MetricsData.getM3();
    const M4 = MetricsData.getM4();

    // Combina com resultados reais do backend
    const populateResults = (list, key) => {
        return list.map((item, i) => ({
            ...item,
            result:
                metrics[key]?.[Object.keys(metrics[key] || {})[i]] ??
                metrics[key]?.[item.name.toLowerCase().replace(/ /g, "")] ??
                "N/A",
        }));
    };

    const metricsWithResults = [
        ...populateResults(M1, "M1_Validade").map((m) => ({ ...m, group: "Validade (M1)", color: METRIC_GROUPS.M1.color })),
        ...populateResults(M2, "M2_Qualidade").map((m) => ({ ...m, group: "Qualidade (M2)", color: METRIC_GROUPS.M2.color })),
        ...populateResults(M3, "M3_Desempenho").map((m) => ({ ...m, group: "Desempenho (M3)", color: METRIC_GROUPS.M3.color })),
        ...populateResults(M4, "M4_Convergencia").map((m) => ({ ...m, group: "Convergência (M4)", color: METRIC_GROUPS.M4.color })),
    ];

    // Dados para gráficos
    const pieData = [
        { name: "Válidas", value: metrics.turmasValidas || 0 },
        { name: "Com Conflitos", value: (metrics.totalTurmas || 0) - (metrics.turmasValidas || 0) },
    ];

    const barData = convergence.map((c) => ({
        turma: c.label.replace(" - ", "\n").split("\n")[1] || c.label,
        fitness: Number(c.finalFitness) || 0,
        válido: c.isValid ? 100 : 0,
    }));

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
            <DialogTitle sx={{ bgcolor: "#2e7d32", color: "white", py: 3 }}>
                <Typography variant="h5" fontWeight="bold">
                    Relatório de Métricas do Algoritmo Genético
                </Typography>
            </DialogTitle>

            <DialogContent dividers sx={{ bgcolor: "#fafafa", p: 3 }}>
                {/* Resumo Rápido */}
                <Paper elevation={2} sx={{ p: 3, mb: 4, border: "1px solid #408349" }}>
                    <Typography variant="h6" gutterBottom color="#2e7d32" fontWeight="bold">
                        Resumo Geral
                    </Typography>
                    <Grid container spacing={3}>
                        {[
                            { label: "Turmas Geradas", value: metrics.totalTurmas || 0 },
                            { label: "Conflitos Totais", value: metrics.totalConflitos || 0, critical: true },
                            { label: "Fitness Médio", value: metrics.fitnessMedio || "N/A" },
                            { label: "Tempo Total", value: metrics.tempoExecucaoTotal || "N/A" },
                        ].map((item, i) => (
                            <Grid item xs={6} sm={3} key={i}>
                                <Box textAlign="center">
                                    <Typography
                                        variant="h4"
                                        fontWeight="bold"
                                        color={item.critical && item.value > 0 ? "#c62828" : "#2e7d32"}
                                    >
                                        {item.value}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {item.label}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>

                {/* Tabela de Métricas Detalhadas */}
                <Typography variant="h6" gutterBottom sx={{ color: "#2e7d32", fontWeight: "bold" }}>
                    Métricas Detalhadas
                </Typography>
                <Table sx={{ bgcolor: "white", border: "1px solid #e0e0e0", borderRadius: 2 }}>
                    <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>Grupo</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Métrica</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Resultado</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {metricsWithResults.map((m, i) => {
                            const isGood = m.result === 0 || m.result === 1 || String(m.result).includes("100%") || m.result > 0.9;
                            const isWarning = m.result > 0.7 && m.result < 0.9;
                            return (
                                <TableRow key={i} hover>
                                    <TableCell>
                                        <Chip
                                            label={m.group}
                                            size="small"
                                            sx={{ bgcolor: m.color + "22", color: m.color, fontWeight: "bold" }}
                                        />
                                    </TableCell>
                                    <TableCell>{m.name}</TableCell>
                                    <TableCell>
                                        <strong>{m.result !== "N/A" ? String(m.result) : "N/A"}</strong>
                                    </TableCell>
                                    <TableCell>
                                        {isGood ? (
                                            <CheckCircleIcon sx={{ color: "#4caf50" }} />
                                        ) : isWarning ? (
                                            <InfoIcon sx={{ color: "#ff9800" }} />
                                        ) : (
                                            <ErrorIcon sx={{ color: "#f44336" }} />
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>

                <Divider sx={{ my: 4 }} />

                {/* Gráficos */}
                <Grid container spacing={4}>
                    {/* Curva de Convergência */}
                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ p: 3, border: "1px solid #408349" }}>
                            <Typography variant="h6" gutterBottom color="#2e7d32" fontWeight="bold">
                                Curva de Convergência (Melhores Soluções)
                            </Typography>
                            <ResponsiveContainer width="100%" height={380}>
                                <LineChart>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="iteration" label={{ value: "Iterações", position: "insideBottom", offset: -8 }} />
                                    <YAxis label={{ value: "Fitness", angle: -90, position: "insideLeft" }} />
                                    <Tooltip formatter={(v) => Number(v).toFixed(1)} />
                                    <Legend />
                                    {convergence.slice(0, 8).map((c, i) => {
                                        // Proteção caso iterations ou data não existam
                                        if (!c.iterations || !c.data || c.iterations.length === 0) return null;

                                        const chartData = c.iterations.map((it, idx) => ({
                                            iteration: it,
                                            fitness: Number(c.data[idx]) || 0,
                                        }));

                                        return (
                                            <Line
                                                key={i}
                                                type="monotone"
                                                data={chartData}
                                                dataKey="fitness"
                                                name={c.label.split(" - ")[1] || c.label}
                                                stroke={c.isValid ? "#2e7d32" : "#c62828"}
                                                strokeWidth={c.isValid ? 3 : 1.5}
                                                dot={false}
                                                connectNulls
                                            />
                                        );
                                    })}
                                </LineChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Gráficos Laterais */}
                    <Grid item xs={12} lg={4}>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Paper sx={{ p: 3, textAlign: "center", border: "1px solid #408349" }}>
                                    <Typography variant="h6" gutterBottom color="#2e7d32" fontWeight="bold">
                                        Soluções Válidas
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                dataKey="value"
                                                label={({ name, value }) => `${name}: ${value}`}
                                            >
                                                {pieData.map((entry, i) => (
                                                    <Cell key={`cell-${i}`} fill={COLORS[i]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Paper>
                            </Grid>

                            <Grid item xs={12}>
                                <Paper sx={{ p: 3, border: "1px solid #408349" }}>
                                    <Typography variant="h6" gutterBottom color="#2e7d32" fontWeight="bold">
                                        Fitness Final por Turma
                                    </Typography>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <BarChart data={barData}>
                                            <XAxis dataKey="turma" angle={-45} textAnchor="end" height={80} fontSize={12} />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="fitness" fill="#2e7d32" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3, bgcolor: "#f5f5f5", borderTop: "1px solid #e0e0e0" }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    size="large"
                    sx={{
                        bgcolor: "#2e7d32",
                        "&:hover": { bgcolor: "#1b5e20" },
                        textTransform: "none",
                        px: 4,
                    }}
                >
                    Fechar Relatório
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { MetricsModal };