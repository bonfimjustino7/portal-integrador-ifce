# metrics_dashboard.py
import streamlit as st
import json
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

# Força o Plotly a gerar imagens de alta qualidade e habilitar menu de download
st.set_page_config(page_title="Relatório AG - Métricas", layout="wide", page_icon="Chart")

# Configuração global do Plotly para permitir download
config = {
    "toImageButtonOptions": {
        "format": "png",    # png, svg, jpeg, webp
        "filename": "grafico",
        "height": 800,
        "width": 1400,
        "scale": 3           # 3x = imagem em alta resolução (perfeita para documentos!)
    },
    "displayModeBar": True,
    "displaylogo": False,
    "modeBarButtonsToAdd": ["toImage"]
}

st.title("Relatório Completo do Algoritmo Genético")
st.markdown("---")

# Sidebar
with st.sidebar:
    st.header("Carregar Resultado")
    json_input = st.text_area(
        "Cole o JSON da API aqui:",
        height=500,
        label_visibility="collapsed",
        placeholder='{"status":"success", ...}'
    )
    if st.button("Carregar Dados", type="primary", use_container_width=True):
        try:
            data = json.loads(json_input)
            st.session_state.data = data
            st.success("Dados carregados com sucesso!")
        except Exception as e:
            st.error(f"Erro no JSON: {e}")

if 'data' not in st.session_state:
    st.info("Cole o JSON da API no painel lateral e clique em **Carregar Dados**.")
    st.stop()

data = st.session_state.data
metrics = data.get("metrics", {})
convergence = data.get("convergence", [])
debug = data.get("debug", {})

# Data da execução
if data.get("generatedAt"):
    dt = datetime.fromisoformat(data["generatedAt"].replace("Z", "+00:00"))
    st.caption(f"Gerado em: **{dt.strftime('%d/%m/%Y às %H:%M:%S')}**")

# Resumo geral
col1, col2, col3, col4 = st.columns(4)
total = data.get("totalTurmas", 0)
validas = data.get("turmasValidas", 0)
conflitos = data.get("totalConflitos", 0)

with col1: st.metric("Total de Turmas", total)
with col2: st.metric("Turmas Válidas", validas, delta=f"{validas/total*100:.1f}%" if total else "0%")
with col3: st.metric("Conflitos Totais", conflitos, delta=-conflitos if conflitos>0 else None)
with col4: st.metric("Fitness Médio", data.get("fitnessMedio", "N/A"))

st.markdown("---")

# ABAS
tab1, tab2, tab3, tab4 = st.tabs(["M1 – Validade", "M2 – Qualidade", "M3 – Desempenho", "M4 – Convergência"])

# ========= M1 =========
with tab1:
    st.subheader("M1 – Validade da Solução")
    m1 = metrics.get("M1_Validade", {})

    c1, c2, c3 = st.columns(3)
    with c1:
        taxa = m1.get("taxaConflitos", 0) * 100
        st.metric("Taxa de Conflitos", f"{taxa:.4f}%", delta="OK" if taxa == 0 else "Erro")
    with c2:
        st.metric("Conflitos Totais", m1.get("numeroTotalConflitos", 0))
    with c3:
        perc = m1.get("solucoesValidas", 0) * 100
        st.metric("Soluções Válidas", f"{perc:.1f}%")

    # Gráfico de pizza (com botão de download)
    if total > 0:
        pie_df = pd.DataFrame({
            "Status": ["Válidas", "Com Conflito"],
            "Quantidade": [validas, total - validas]
        })
        fig_pie = px.pie(
            pie_df, values="Quantidade", names="Status",
            color_discrete_sequence=["#4caf50", "#f44336"],
            hole=0.4,
            title="Distribuição de Turmas Válidas"
        )
        fig_pie.update_traces(textposition='inside', textinfo='percent+label')
        fig_pie.update_layout(title_x=0.5, font=dict(size=14))
        st.plotly_chart(fig_pie, use_container_width=True, config=config)

    if debug.get("conflicts"):
        st.error("Conflitos Detectados")
        for c in debug["conflicts"]:
            st.write(f"• **{c.get('type')}:** {c.get('message')}")

# ========= M2 =========
with tab2:
    st.subheader("M2 – Qualidade da Solução")
    m2 = metrics.get("M2_Qualidade", {})

    col1, col2, col3 = st.columns(3)
    with col1: st.metric("Fitness Médio", f"{m2.get('fitnessMedio', 0):.2f}")
    with col2: st.metric("Fitness Máximo", f"{m2.get('fitnessMaximo', 0):.2f}")
    with col3: st.metric("Desvio Padrão do Fitness", f"{m2.get('desvioPadraoFitness', 0):.2f}")

    col4, col5, col6 = st.columns(3)
    with col4:
        carga = m2.get("balanceamentoCarga", 0)
        st.metric("Balanceamento de Carga", f"{carga:.2f}", delta="Bom" if carga <= 5 else "Revisar")
    with col5:
        uso = m2.get("usoSlots", 0) * 100
        st.metric("Uso de Slots", f"{uso:.1f}%")
    with col6: st.metric("Índice de Consecutividade", f"{m2.get('indiceConsecutividade', 0):.2f}")

# ========= M3 =========
with tab3:
    st.subheader("M3 – Desempenho do Algoritmo")
    m3 = metrics.get("M3_Desempenho", {})

    col1, col2, col3, col4 = st.columns(4)
    with col1: st.metric("Tempo Total", m3.get("tempoExecucaoTotal", "N/A"))
    with col2: st.metric("Tempo por Turma", m3.get("tempoPorTurma", "N/A"))
    with col3: st.metric("Iterações Totais", f"{m3.get('iteracoesEstimadas', 0):,}".replace(",", "."))
    with col4: st.metric("Memória Máxima", m3.get("usoMemoria", "N/A"))

    col5, col6, col7 = st.columns(3)
    with col5: st.metric("Iterações até Convergência", f"{m3.get('iteracoesAteConvergencia', 'N/A')}")
    with col6: st.metric("Taxa de Melhoria", f"{m3.get('taxaMelhoria', 'N/A')}")
    with col7: st.metric("Número de Evoluções", f"{m3.get('numeroEvolucoes', 0):,}".replace(",", "."))

# ========= M4 =========

with tab4:
    st.subheader("M4 – Análise de Convergência")
    m4 = metrics.get("M4_Convergencia", {})

    col1, col2, col3, col4, col5 = st.columns(5)
    with col1:
        taxa = m4.get("taxaConvergencia", 0) * 100
        st.metric("Taxa de Convergência", f"{taxa:.1f}%", delta="Excelente" if taxa >= 95 else "Atenção")
    with col2:
        st.metric("Turmas Convergidas", m4.get("turmasConvergiramBem", "N/A"))
    with col3:
        st.metric("Diversidade", f"{m4.get('diversidadeEstimada', 0):.2f}")
    with col4:
        st.metric("Estagnação", f"{m4.get('estagnacao', 0):.1f}")
    with col5:
        taxa_mut = m4.get("taxaMutacaoEfetiva", 0) * 100
        st.metric("Taxa de Mutação Efetiva", f"{taxa_mut:.1f}%")

    st.markdown("---")
    st.subheader("Curvas de Convergência (Clique no ícone de câmera para baixar)")

    if convergence:
        for i, item in enumerate(convergence):  # Mostra até 12 turmas
            df = pd.DataFrame({
                "Iteração": item["iterations"],
                "Fitness": [float(x) for x in item["data"]]
            })
            nome = item["label"].split(" - ")[-1] if " - " in item["label"] else item["label"]
            cor = "#2e7d32" if item.get("isValid", True) else "#c62828"
            titulo = f"Convergência: {nome}"

            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=df["Iteração"], 
                y=df["Fitness"],
                mode='lines+markers',
                line=dict(color=cor, width=3 if item.get("isValid") else 2),
                name="Fitness"
            ))
            fig.update_layout(
                title=titulo,
                xaxis_title="Iteração",
                yaxis_title="Fitness",
                height=400,
                template="simple_white",
                font=dict(size=13),
                title_x=0.5
            )

            # ← Aqui está a correção principal!
            st.plotly_chart(
                fig, 
                use_container_width=True, 
                config=config,
                key=f"convergencia_turma_{i}"   # chave única para cada gráfico
            )
    else:
        st.info("Nenhum dado de convergência disponível.")

# Rodapé
st.markdown("---")
st.markdown("""
<div style='text-align: center; color: gray;'>
    <strong>Dica:</strong> Clique no ícone de câmera <span style='color:#0068c9;'>⬇</span> no canto superior direito de cada gráfico para baixar em PNG de alta qualidade!
</div>
""", unsafe_allow_html=True)