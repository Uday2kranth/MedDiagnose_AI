import streamlit as st
import streamlit.components.v1 as components
import pandas as pd
import numpy as np
import os
import base64
from pathlib import Path
import streamlit_antd_components as sac
from streamlit_echarts import st_echarts
from streamlit_option_menu import option_menu

# ============================================================
# DOTLOTTIE HELPER
# ============================================================
def render_lottie(filename: str, height: int = 250, speed: float = 1.0, loop: bool = True):
    """Render a .lottie file using the official dotLottie web player via st.components.v1.html."""
    base = os.path.dirname(os.path.abspath(__file__))
    filepath = os.path.join(base, filename)
    
    if not os.path.exists(filepath):
        return
    
    with open(filepath, "rb") as f:
        data = f.read()
    b64 = base64.b64encode(data).decode("utf-8")
    
    loop_str = "true" if loop else "false"
    
    html = f"""
    <script src="https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs" type="module"></script>
    <div style="display:flex; justify-content:center; align-items:center;">
        <dotlottie-player
            src="data:application/octet-stream;base64,{b64}"
            background="transparent"
            speed="{speed}"
            style="width: auto; height: {height}px;"
            direction="1"
            playMode="normal"
            {"loop" if loop else ""}
            autoplay
        ></dotlottie-player>
    </div>
    """
    components.html(html, height=height + 20)

# ============================================================
# PAGE CONFIG
# ============================================================
st.set_page_config(
    page_title="MedDiagnose AI · Intelligent Medical Analysis",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# ============================================================
# PREMIUM DARK GLASS CSS — AWARD-WINNING DESIGN
# ============================================================
CSS = """
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

/* ── Reset & Typography ──────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }
html, body, [class*="css"], p, span, label, div {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
    color: #e2e8f0 !important;
}
code, pre, .stCode {
    font-family: 'JetBrains Mono', monospace !important;
}

/* ── Keyframes ───────────────────────────────────── */
@keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(28px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes shimmer {
    0%   { background-position: -300% 0; }
    100% { background-position: 300% 0; }
}
@keyframes floatBob {
    0%, 100% { transform: translateY(0px); }
    50%      { transform: translateY(-10px); }
}
@keyframes pulseRing {
    0%   { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.6); }
    70%  { box-shadow: 0 0 0 18px rgba(139, 92, 246, 0); }
    100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
}
@keyframes gradientFlow {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}
@keyframes borderGlow {
    0%, 100% { border-color: rgba(139, 92, 246, 0.15); }
    50%      { border-color: rgba(80, 227, 194, 0.4); }
}
@keyframes breathe {
    0%, 100% { opacity: 0.4; }
    50%      { opacity: 0.8; }
}
@keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
}
@keyframes scaleIn {
    from { opacity: 0; transform: scale(0.8); }
    to   { opacity: 1; transform: scale(1); }
}
@keyframes glowPulse {
    0%, 100% { filter: drop-shadow(0 0 8px rgba(80,227,194,0.3)); }
    50%      { filter: drop-shadow(0 0 20px rgba(80,227,194,0.6)); }
}
@keyframes particleFloat1 {
    0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.3; }
    25%      { transform: translate(30px, -40px) rotate(90deg); opacity: 0.6; }
    50%      { transform: translate(-20px, -80px) rotate(180deg); opacity: 0.3; }
    75%      { transform: translate(50px, -40px) rotate(270deg); opacity: 0.5; }
}

/* ── App Background — Deep space feel ────────────── */
.stApp {
    background: #030711 !important;
    background-image:
        radial-gradient(ellipse at 10% 5%, rgba(139, 92, 246, 0.07) 0%, transparent 45%),
        radial-gradient(ellipse at 90% 85%, rgba(80, 227, 194, 0.05) 0%, transparent 45%),
        radial-gradient(ellipse at 50% 50%, rgba(74, 144, 226, 0.03) 0%, transparent 55%),
        radial-gradient(circle at 80% 20%, rgba(255, 107, 107, 0.03) 0%, transparent 30%) !important;
    min-height: 100vh;
}
/* Subtle noise overlay for depth */
.stApp::before {
    content: '';
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.015'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 0;
}

/* ── Glass Card ──────────────────────────────────── */
div[data-testid="stVerticalBlock"] > div > div[data-testid="stVerticalBlock"] {
    background: linear-gradient(
        165deg,
        rgba(255, 255, 255, 0.035) 0%,
        rgba(255, 255, 255, 0.012) 40%,
        rgba(255, 255, 255, 0.004) 100%
    ) !important;
    backdrop-filter: blur(28px) saturate(160%) !important;
    -webkit-backdrop-filter: blur(28px) saturate(160%) !important;
    border-radius: 22px !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    border-top: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
    padding: 2rem !important;
    box-shadow:
        0 10px 40px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.03),
        inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
    animation: fadeSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.45s ease !important;
    position: relative;
    overflow: hidden;
}
/* Shimmer line */
div[data-testid="stVerticalBlock"] > div > div[data-testid="stVerticalBlock"]::before {
    content: '';
    position: absolute;
    top: 0; left: -60%;
    width: 220%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(139,92,246,0.2), rgba(80,227,194,0.15), transparent);
    background-size: 300% 100%;
    animation: shimmer 6s infinite linear;
    z-index: 1;
}
div[data-testid="stVerticalBlock"] > div > div[data-testid="stVerticalBlock"]:hover {
    transform: translateY(-4px) !important;
    box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.6),
        0 0 40px rgba(139, 92, 246, 0.04),
        inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
}

/* ── Headers ─────────────────────────────────────── */
h1 {
    background: linear-gradient(135deg, #8B5CF6, #50E3C2, #4A90E2, #FF6B6B) !important;
    background-size: 300% 300% !important;
    animation: gradientFlow 8s ease infinite !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    font-weight: 900 !important;
    letter-spacing: -1.5px !important;
}
h2 {
    color: #f1f5f9 !important;
    font-weight: 700 !important;
}
h3 {
    color: #e2e8f0 !important;
    font-weight: 600 !important;
}
h4 {
    color: #cbd5e1 !important;
    font-weight: 600 !important;
}

/* ── Buttons ─────────────────────────────────────── */
div.stButton > button {
    background: linear-gradient(135deg, #8B5CF6, #6366F1, #50E3C2) !important;
    background-size: 200% 200% !important;
    animation: gradientFlow 4s ease infinite !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 14px !important;
    font-weight: 700 !important;
    font-family: 'Inter', sans-serif !important;
    letter-spacing: 0.4px !important;
    padding: 0.7rem 1.8rem !important;
    box-shadow: 0 6px 24px rgba(139, 92, 246, 0.35) !important;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
    position: relative !important;
    overflow: hidden !important;
}
div.stButton > button::before {
    content: '' !important;
    position: absolute !important;
    top: 0 !important; left: 0 !important;
    width: 100% !important; height: 50% !important;
    background: linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%) !important;
    border-radius: 14px 14px 0 0 !important;
    pointer-events: none !important;
}
div.stButton > button:hover {
    transform: translateY(-4px) scale(1.04) !important;
    box-shadow: 0 12px 36px rgba(139, 92, 246, 0.5), 0 0 20px rgba(80, 227, 194, 0.2) !important;
}
div.stButton > button:active {
    transform: translateY(1px) scale(0.98) !important;
}
/* Button text fix */
div.stButton > button p, div.stButton > button span {
    color: #ffffff !important;
}

/* ── Inputs ──────────────────────────────────────── */
.stTextInput > div > div > input,
.stNumberInput > div > div > input {
    background: rgba(255, 255, 255, 0.04) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 12px !important;
    color: #f1f5f9 !important;
    font-family: 'Inter', sans-serif !important;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.stTextInput > div > div > input:hover,
.stNumberInput > div > div > input:hover {
    border-color: rgba(139, 92, 246, 0.35) !important;
    background: rgba(255, 255, 255, 0.06) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.08) !important;
}
.stTextInput > div > div > input:focus,
.stNumberInput > div > div > input:focus {
    border-color: rgba(139, 92, 246, 0.5) !important;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12), 0 8px 24px rgba(139, 92, 246, 0.1) !important;
    transform: translateY(-2px) !important;
}
/* Selectbox */
.stSelectbox > div > div, .stMultiSelect > div > div {
    background: rgba(255, 255, 255, 0.04) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 12px !important;
    color: #f1f5f9 !important;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
.stSelectbox > div > div:hover, .stMultiSelect > div > div:hover {
    border-color: rgba(139, 92, 246, 0.35) !important;
    background: rgba(255, 255, 255, 0.06) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 6px 20px rgba(139, 92, 246, 0.08) !important;
}
/* Labels */
.stSelectbox label, .stMultiSelect label, .stTextInput label, .stNumberInput label, .stFileUploader label {
    color: #94a3b8 !important;
    font-weight: 500 !important;
    font-size: 0.85rem !important;
    transition: color 0.3s ease !important;
}

/* ── File Uploader ───────────────────────────────── */
div[data-testid="stFileUploader"] {
    background: rgba(139, 92, 246, 0.03) !important;
    border: 2px dashed rgba(139, 92, 246, 0.25) !important;
    border-radius: 18px !important;
    padding: 1.2rem !important;
    animation: borderGlow 4s ease-in-out infinite;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
}
div[data-testid="stFileUploader"]:hover {
    background: rgba(139, 92, 246, 0.08) !important;
    border-color: rgba(80, 227, 194, 0.5) !important;
    transform: translateY(-4px) scale(1.01) !important;
    box-shadow: 0 12px 36px rgba(139, 92, 246, 0.12), 0 0 20px rgba(80, 227, 194, 0.06) !important;
}

/* ── Dataframe ───────────────────────────────────── */
.stDataFrame {
    border-radius: 16px !important;
    overflow: hidden !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
}

/* ── Radio Buttons ───────────────────────────────── */
div[data-testid="stRadio"] > div { gap: 0.6rem; }
div[data-testid="stRadio"] label {
    background: rgba(255,255,255,0.025) !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    border-radius: 14px !important;
    padding: 0.75rem 1.5rem !important;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
    color: #cbd5e1 !important;
    cursor: pointer !important;
}
div[data-testid="stRadio"] label:hover {
    background: rgba(139, 92, 246, 0.1) !important;
    border-color: rgba(139, 92, 246, 0.35) !important;
    transform: translateY(-4px) scale(1.02) !important;
    box-shadow: 0 8px 28px rgba(139, 92, 246, 0.15), 0 0 15px rgba(80, 227, 194, 0.05) !important;
    color: #f1f5f9 !important;
}
div[data-testid="stRadio"] label:active {
    transform: translateY(0px) scale(0.98) !important;
}

/* ── Alerts ──────────────────────────────────────── */
div[data-testid="stAlert"] {
    background: rgba(255,255,255,0.025) !important;
    border-radius: 14px !important;
    border-left: 4px solid #8B5CF6 !important;
    backdrop-filter: blur(10px) !important;
    color: #e2e8f0 !important;
}
div[data-testid="stAlert"] p {
    color: #cbd5e1 !important;
}

/* ── Chat Messages ───────────────────────────────── */
div[data-testid="stChatMessage"] {
    background: rgba(255,255,255,0.025) !important;
    border-radius: 18px !important;
    border: 1px solid rgba(255,255,255,0.05) !important;
    animation: fadeSlideUp 0.35s ease forwards;
    padding: 1rem 1.2rem !important;
    transition: all 0.3s ease !important;
}
div[data-testid="stChatMessage"]:hover {
    background: rgba(255,255,255,0.04) !important;
    border-color: rgba(139, 92, 246, 0.12) !important;
    transform: translateY(-2px) !important;
}
div[data-testid="stChatMessage"] p,
div[data-testid="stChatMessage"] li,
div[data-testid="stChatMessage"] span {
    color: #e2e8f0 !important;
}

/* ── Metrics ─────────────────────────────────────── */
div[data-testid="stMetric"] {
    background: rgba(255,255,255,0.03) !important;
    border-radius: 14px !important;
    padding: 1rem !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    animation: scaleIn 0.5s ease forwards;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
    cursor: default;
}
div[data-testid="stMetric"]:hover {
    transform: translateY(-5px) scale(1.03) !important;
    border-color: rgba(80, 227, 194, 0.2) !important;
    box-shadow: 0 10px 30px rgba(80, 227, 194, 0.08), 0 0 12px rgba(80, 227, 194, 0.04) !important;
}
div[data-testid="stMetric"] label {
    color: #64748b !important;
    font-size: 0.72rem !important;
    letter-spacing: 1.5px !important;
    text-transform: uppercase !important;
}
div[data-testid="stMetric"] div[data-testid="stMetricValue"] {
    color: #50E3C2 !important;
    font-weight: 800 !important;
}

/* ── Code Block ──────────────────────────────────── */
.stCode, pre {
    background: rgba(0, 0, 0, 0.4) !important;
    border: 1px solid rgba(255,255,255,0.06) !important;
    border-radius: 14px !important;
}
code {
    color: #50E3C2 !important;
    background: rgba(80, 227, 194, 0.08) !important;
    border-radius: 6px;
    padding: 0.15rem 0.4rem;
}

/* ── Divider ─────────────────────────────────────── */
hr {
    border-color: rgba(255,255,255,0.04) !important;
    margin: 1.5rem 0 !important;
}

/* ── Scrollbar ───────────────────────────────────── */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.2); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(139, 92, 246, 0.4); }

/* ── Success / Warning ───────────────────────────── */
div.stSuccess {
    background: rgba(80, 227, 194, 0.06) !important;
    border-left-color: #50E3C2 !important;
}
div.stWarning {
    background: rgba(247, 183, 51, 0.06) !important;
}

/* ── Spinner ─────────────────────────────────────── */
div.stSpinner > div { border-top-color: #8B5CF6 !important; }

/* ── Chat Input ──────────────────────────────────── */
div[data-testid="stChatInput"] {
    border-color: rgba(139, 92, 246, 0.2) !important;
    background: rgba(255,255,255,0.02) !important;
}
div[data-testid="stChatInput"] textarea {
    color: #f1f5f9 !important;
}

/* ── Floating Chat Bubble ────────────────────────── */
@keyframes bubblePulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.5), 0 8px 32px rgba(139,92,246,0.3); }
    50% { box-shadow: 0 0 0 12px rgba(139,92,246,0), 0 12px 40px rgba(139,92,246,0.4); }
}
@keyframes bubbleFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
}
@keyframes chatPanelSlide {
    from { opacity: 0; transform: translateY(20px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}
.chat-panel-container {
    animation: chatPanelSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    background: rgba(3, 7, 17, 0.95) !important;
    border: 1px solid rgba(139, 92, 246, 0.15) !important;
    border-radius: 20px !important;
    backdrop-filter: blur(20px) !important;
    padding: 0.5rem !important;
    margin-top: 1rem !important;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(139,92,246,0.08) !important;
}
.chat-panel-header {
    background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(80,227,194,0.06));
    border-radius: 16px;
    padding: 0.8rem 1.2rem;
    margin-bottom: 0.5rem;
    border: 1px solid rgba(139,92,246,0.1);
}
.chat-status-dot {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #50E3C2;
    margin-right: 6px;
    animation: bubblePulse 2s infinite;
    box-shadow: 0 0 6px rgba(80,227,194,0.5);
}
.cooldown-bar {
    height: 3px;
    background: linear-gradient(90deg, #8B5CF6, #50E3C2);
    border-radius: 3px;
    transition: width 0.3s ease;
}
</style>
"""
st.markdown(CSS, unsafe_allow_html=True)

# ============================================================
# SESSION STATE
# ============================================================
defaults = {
    'step': 0,
    'df': None,
    'pipeline': None,
    'target_col': None,
    'feature_cols': None,
    'accuracy': None,
    'label_encoder': None,
    'X_train': None,
    'last_report': None,
    'show_chat': False,
    'api_key_set': False,
    'gemini_api_key': '',
    'gemini_model': 'gemini-2.0-flash',
    'user_rating': None,
}
for k, v in defaults.items():
    if k not in st.session_state:
        st.session_state[k] = v

# ============================================================
# HOME BUTTON (always visible when not on step 0)
# ============================================================
if st.session_state.step > 0:
    home_cols = st.columns([1, 8])
    with home_cols[0]:
        if st.button("🏠 Home"):
            # Reset everything
            from chatbot_agent import reset_chatbot
            reset_chatbot()
            for k, v in defaults.items():
                st.session_state[k] = v
            st.rerun()

# ============================================================
# HEADER
# ============================================================
st.markdown("""
<div style="margin-bottom: 0.5rem;">
    <h1 style="margin-bottom: 0; font-size: 2.8rem; line-height: 1.1;">🧬 MedDiagnose AI</h1>
    <p style="color: #64748b !important; font-size: 0.9rem; margin-top: 6px; letter-spacing: 1.5px; font-weight: 400;">
    INTELLIGENT MEDICAL ANALYSIS · EXPLAINABLE AI · CLINICAL INSIGHTS
    </p>
</div>
""", unsafe_allow_html=True)

# ── Step Progress Bar ──
current = st.session_state.step
sac.steps(
    items=[
        sac.StepsItem(title='Upload', icon='cloud-upload'),
        sac.StepsItem(title='Configure', icon='sliders'),
        sac.StepsItem(title='Train', icon='cpu'),
        sac.StepsItem(title='Results', icon='graph-up-arrow'),
    ],
    index=current,
    format_func='title',
    size='sm',
)

# ============================================================
# STEP 0: UPLOAD
# ============================================================
if st.session_state.step == 0:
    st.markdown("")
    col_upload, col_anim = st.columns([1, 1], gap="large")
    
    with col_upload:
        with st.container():
            sac.divider(label='Upload Medical Dataset', icon='cloud-upload', align='start', color='violet')
            st.markdown('<p style="color: #64748b !important; font-size: 0.85rem;">Drop a CSV file containing patient data to begin AI-powered analysis</p>', unsafe_allow_html=True)
            
            uploaded_file = st.file_uploader("Upload CSV", type=["csv"], key="uploader", label_visibility="collapsed")
            if uploaded_file is not None:
                try:
                    df = pd.read_csv(uploaded_file)
                    st.session_state.df = df
                    st.session_state.step = 1
                    st.rerun()
                except Exception as e:
                    st.error(f"Error reading dataset: {e}")
            
            st.markdown("""
            <div style="margin-top: 1.5rem; padding: 1rem 1.2rem; border-radius: 14px; 
                        background: linear-gradient(135deg, rgba(139,92,246,0.05), rgba(80,227,194,0.03)); 
                        border: 1px solid rgba(139,92,246,0.12);">
                <p style="color: #94a3b8 !important; font-size: 0.82rem; margin: 0; line-height: 1.5;">
                    💡 <strong style="color: #cbd5e1 !important;">Supported formats:</strong> Any tabular CSV with a target column — 
                    heart disease, diabetes, cancer, liver disease, and more.
                </p>
            </div>
            """, unsafe_allow_html=True)
    
    with col_anim:
        render_lottie("Man and robot with computers sitting together in workplace.lottie", height=340)

# ============================================================
# STEP 1: CONFIGURATION
# ============================================================
elif st.session_state.step == 1:
    df = st.session_state.df
    
    with st.container():
        st.markdown("""
        <h3 style="color: #f1f5f9 !important;">⚙️ Model Configuration</h3>
        <p style="color: #64748b !important; font-size: 0.85rem;">
            Select which column to predict and which features the model should learn from
        </p>
        """, unsafe_allow_html=True)
    
    # Dataset stats
    with st.container():
        st.markdown('<p style="color: #64748b !important; font-weight: 600; font-size: 0.72rem; letter-spacing: 2px; margin-bottom: 0.8rem;">DATASET OVERVIEW</p>', unsafe_allow_html=True)
        
        stat_cols = st.columns(4)
        stat_cols[0].metric("Rows", f"{len(df):,}")
        stat_cols[1].metric("Columns", f"{len(df.columns)}")
        stat_cols[2].metric("Missing Values", f"{df.isnull().sum().sum():,}")
        stat_cols[3].metric("Numeric Features", f"{len(df.select_dtypes(include='number').columns)}")
        
        st.dataframe(df.head(8), use_container_width=True, height=280)
    
    # Column Selection
    with st.container():
        st.markdown('<p style="color: #64748b !important; font-weight: 600; font-size: 0.72rem; letter-spacing: 2px; margin-bottom: 0.8rem;">COLUMN SELECTION</p>', unsafe_allow_html=True)
        
        sel_col1, sel_col2 = st.columns(2)
        with sel_col1:
            target = st.selectbox("🎯 Target (Output) Column", df.columns.tolist(), index=len(df.columns) - 1)
        with sel_col2:
            remaining_cols = [c for c in df.columns if c != target]
            features = st.multiselect("📊 Feature Columns", remaining_cols, default=remaining_cols)
        
        st.markdown("")
        _, btn_c, _ = st.columns([1, 2, 1])
        with btn_c:
            if st.button("🚀  Train Model", use_container_width=True):
                if not features:
                    st.warning("Please select at least one feature.")
                else:
                    st.session_state.target_col = target
                    st.session_state.feature_cols = features
                    st.session_state.step = 2
                    st.rerun()

# ============================================================
# STEP 2: TRAINING
# ============================================================
elif st.session_state.step == 2:
    from ml_pipeline import train_model
    
    _, center, _ = st.columns([1, 2, 1])
    with center:
        st.markdown("""
        <div style="text-align: center; padding: 2rem 0;">
            <h3 style="color: #f1f5f9 !important;">⚙️ Training in Progress...</h3>
            <p style="color: #64748b !important;">Building preprocessing pipeline & optimizing XGBoost model</p>
        </div>
        """, unsafe_allow_html=True)
        render_lottie("Sparkles Loop Loader ai.lottie", height=180)
    
    with st.spinner("Processing..."):
        pipeline, le, accuracy, X_train = train_model(
            st.session_state.df,
            st.session_state.target_col,
            st.session_state.feature_cols
        )
        st.session_state.pipeline = pipeline
        st.session_state.label_encoder = le
        st.session_state.accuracy = accuracy
        st.session_state.X_train = X_train
        st.session_state.step = 3
        st.rerun()

# ============================================================
# STEP 3: RESULTS & XAI
# ============================================================
elif st.session_state.step == 3:
    acc_pct = st.session_state.accuracy * 100
    
    if acc_pct >= 85:
        acc_color = ["#50E3C2", "#2dd4bf"]
        acc_label = "Excellent"
    elif acc_pct >= 70:
        acc_color = ["#4A90E2", "#60a5fa"]
        acc_label = "Good"
    elif acc_pct >= 55:
        acc_color = ["#F7B733", "#fbbf24"]
        acc_label = "Fair"
    else:
        acc_color = ["#FF6B6B", "#f87171"]
        acc_label = "Low"
    
    # ── Animated ECharts Gauge for Accuracy ──
    gauge_col1, gauge_col2 = st.columns([1, 2])
    with gauge_col1:
        gauge_opts = {
            "series": [{
                "type": "gauge",
                "startAngle": 220,
                "endAngle": -40,
                "min": 0,
                "max": 100,
                "splitNumber": 10,
                "itemStyle": {"color": acc_color[0]},
                "progress": {
                    "show": True,
                    "width": 20,
                    "itemStyle": {"color": acc_color[0]}
                },
                "pointer": {"show": False},
                "axisLine": {"lineStyle": {"width": 20, "color": [[1, "rgba(255,255,255,0.05)"]]}},
                "axisTick": {"show": False},
                "splitLine": {"show": False},
                "axisLabel": {"show": False},
                "anchor": {"show": False},
                "title": {"show": False},
                "detail": {
                    "valueAnimation": True,
                    "width": "60%",
                    "borderRadius": 8,
                    "offsetCenter": [0, "0%"],
                    "fontSize": 32,
                    "fontWeight": "bolder",
                    "formatter": "{value}%",
                    "color": acc_color[0]
                },
                "data": [{"value": round(acc_pct, 1)}]
            }],
            "backgroundColor": "transparent"
        }
        st_echarts(options=gauge_opts, height="260px")
    
    with gauge_col2:
        st.markdown(f"""
        <div style="padding: 2rem 0;">
            <h2 style="color: {acc_color[0]} !important; margin:0;">{acc_label} Model Performance</h2>
            <p style="color: #94a3b8 !important; font-size: 0.9rem; margin-top: 8px;">XGBoost Classifier · {len(st.session_state.X_train)} training samples · {len(st.session_state.feature_cols)} features</p>
        </div>
        """, unsafe_allow_html=True)
        
        info_cols = st.columns(3)
        info_cols[0].metric("Accuracy", f"{acc_pct:.1f}%")
        info_cols[1].metric("Train Size", f"{len(st.session_state.X_train)}")
        info_cols[2].metric("Features", f"{len(st.session_state.feature_cols)}")
    
    st.markdown("")
    
    # ── Mode Selection with option_menu ──
    mode = option_menu(
        menu_title=None,
        options=["Patient Inference", "Batch Analysis"],
        icons=["person-badge", "bar-chart-line"],
        default_index=0,
        orientation="horizontal",
        styles={
            "container": {"padding": "0", "background-color": "rgba(255,255,255,0.02)", "border-radius": "14px", "border": "1px solid rgba(255,255,255,0.06)"},
            "icon": {"color": "#8B5CF6", "font-size": "18px"},
            "nav-link": {"font-size": "14px", "font-weight": "600", "color": "#94a3b8", "border-radius": "12px", "margin": "4px", "padding": "10px 20px", "--hover-color": "rgba(139,92,246,0.08)"},
            "nav-link-selected": {"background": "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(80,227,194,0.1))", "color": "#f1f5f9", "font-weight": "700", "border": "1px solid rgba(139,92,246,0.2)"},
        }
    )
    st.markdown("")
    
    # ── Branch A: Batch ──
    if mode == "Batch Analysis":
        with st.container():
            sac.divider(label='Global Feature Importance', icon='diagram-3', align='start', color='violet')
            st.markdown('<p style="color: #64748b !important; font-size: 0.85rem;">SHAP summary across training data — see which features matter most globally</p>', unsafe_allow_html=True)
            
            from xai_explainer import generate_shap_values
            import shap
            import matplotlib.pyplot as plt
            
            with st.spinner("Generating SHAP summary plot..."):
                sample = st.session_state.X_train.sample(min(100, len(st.session_state.X_train)), random_state=42)
                explainer, shap_exp, X_trans, f_names = generate_shap_values(
                    st.session_state.pipeline, sample, st.session_state.X_train
                )
                
                fig, ax = plt.subplots(figsize=(10, 6))
                fig.patch.set_facecolor('#030711')
                ax.set_facecolor('#030711')
                ax.xaxis.label.set_color('#94a3b8')
                ax.yaxis.label.set_color('#94a3b8')
                ax.tick_params(colors='#94a3b8')
                for spine in ax.spines.values():
                    spine.set_color('#1e293b')
                ax.spines['top'].set_visible(False)
                ax.spines['right'].set_visible(False)
                
                shap.summary_plot(shap_exp.values, X_trans, feature_names=f_names, show=False)
                st.pyplot(fig)
    
    # ── Branch B: Individual ──
    else:
        with st.container():
            sac.divider(label='Patient Clinical Inference', icon='person-badge', align='start', color='green')
            st.markdown('<p style="color: #64748b !important; font-size: 0.85rem;">Enter specific feature values for a patient to get a prediction with full XAI breakdown</p>', unsafe_allow_html=True)
            
            input_data = {}
            features = st.session_state.feature_cols
            df = st.session_state.df
            
            cols = st.columns(3)
            for i, feat in enumerate(features):
                with cols[i % 3]:
                    if pd.api.types.is_numeric_dtype(df[feat]):
                        mean_val = float(df[feat].mean())
                        min_val = float(df[feat].min())
                        max_val = float(df[feat].max())
                        input_data[feat] = st.number_input(
                            f"{feat}", value=mean_val, min_value=min_val, max_value=max_val * 2,
                            help=f"Range: {min_val:.2f} – {max_val:.2f}"
                        )
                    else:
                        modes = df[feat].dropna().unique().tolist()
                        input_data[feat] = st.selectbox(f"{feat}", modes)
            
            st.markdown("")
            _, btn_c, _ = st.columns([1, 2, 1])
            with btn_c:
                run_pred = st.button("🔍  Run Prediction & XAI Analysis", use_container_width=True)
            
            if run_pred:
                input_df = pd.DataFrame([input_data])
                pipeline = st.session_state.pipeline
                
                pred = pipeline.predict(input_df)[0]
                le = st.session_state.label_encoder
                diagnosis = le.inverse_transform([pred])[0]
                try:
                    proba = pipeline.predict_proba(input_df)[0][pred] * 100
                except Exception:
                    proba = None
                
                # Color coding
                positive_words = ['malignant', 'yes', '1', 'positive', 'true', 'diabetic']
                is_positive = any(w in str(diagnosis).lower() for w in positive_words)
                diag_color = "#FF6B6B" if is_positive else "#50E3C2"
                conf_text = f"<p style='color: #94a3b8 !important; font-size: 0.9rem; margin-top: 4px;'>Confidence: <strong style=\"color: {diag_color} !important;\">{proba:.1f}%</strong></p>" if proba else ""
                
                st.markdown(f"""
                <div style="
                    text-align: center;
                    padding: 2.5rem;
                    border-radius: 22px;
                    background: linear-gradient(135deg, {diag_color}08, {diag_color}03);
                    border: 1px solid {diag_color}25;
                    margin: 1.8rem 0;
                    animation: scaleIn 0.5s ease forwards;
                ">
                    <p style="color: #64748b !important; font-size: 0.72rem; letter-spacing: 2.5px; margin-bottom: 0.8rem; font-weight: 600;">PREDICTED CONDITION</p>
                    <h1 style="
                        background: none !important;
                        -webkit-text-fill-color: {diag_color} !important;
                        font-size: 3rem;
                        text-shadow: 0 0 40px {diag_color}30;
                        margin: 0;
                        letter-spacing: -1px;
                    ">{diagnosis}</h1>
                    {conf_text}
                </div>
                """, unsafe_allow_html=True)
                
                # Success animation
                _, suc_c, _ = st.columns([1, 1, 1])
                with suc_c:
                    render_lottie("Check Mark.lottie", height=120, loop=False)
                
                # SHAP Plots
                from xai_explainer import generate_shap_values, get_top_features_summary
                import shap
                from streamlit_shap import st_shap
                
                with st.spinner("Generating XAI explanations..."):
                    explainer, shap_exp, X_trans, f_names = generate_shap_values(
                        pipeline, input_df, st.session_state.X_train
                    )
                    
                    st.markdown('<p style="color: #64748b !important; font-weight: 600; font-size: 0.72rem; letter-spacing: 2px; margin-top: 1.5rem;">EXPLAINABLE AI BREAKDOWN</p>', unsafe_allow_html=True)
                    
                    st.markdown("#### Interactive Force Plot")
                    if len(shap_exp.values.shape) > 1 and shap_exp.values.shape[0] == 1:
                        if len(shap_exp.values.shape) == 2:
                            st_shap(shap.force_plot(explainer.expected_value, shap_exp.values[0, :], X_trans[0, :], feature_names=f_names))
                        else:
                            st_shap(shap.force_plot(explainer.expected_value[pred], shap_exp.values[0, :, pred], X_trans[0, :], feature_names=f_names))
                    elif hasattr(explainer, "expected_value"):
                        st_shap(shap.force_plot(explainer.expected_value, shap_exp.values[0], X_trans[0, :], feature_names=f_names))
                
                # Report
                report = get_top_features_summary(shap_exp, f_names)
                full_report = f"Diagnosis: {diagnosis}\nConfidence: {proba:.1f}%\n\nTop contributing factors:\n{report}" if proba else f"Diagnosis: {diagnosis}\n\nTop contributing factors:\n{report}"
                st.session_state.last_report = full_report
                
                sac.divider(label='Prediction Report', icon='file-earmark-medical', align='start', color='green')
                
                st.markdown("""
                <div style="padding: 0.9rem 1.2rem; border-radius: 12px; 
                            background: rgba(139,92,246,0.05); border: 1px solid rgba(139,92,246,0.12); margin-bottom: 0.8rem;">
                    <p style="color: #94a3b8 !important; font-size: 0.82rem; margin: 0;">
                        💬 The AI Chatbot below already has access to this report. Click <strong style="color: #cbd5e1 !important;">AI Chat</strong> to discuss your results!
                    </p>
                </div>
                """, unsafe_allow_html=True)
                st.code(full_report, language='markdown')
                
                # Export Buttons
                sac.divider(label='Download Report', icon='download', align='start', color='cyan')
                from report_export import export_txt, export_md
                
                exp_cols = st.columns(2)
                with exp_cols[0]:
                    st.download_button("📄 TXT", data=export_txt(full_report), file_name="meddiagnose_report.txt", mime="text/plain", use_container_width=True)
                with exp_cols[1]:
                    st.download_button("📝 Markdown", data=export_md(full_report), file_name="meddiagnose_report.md", mime="text/markdown", use_container_width=True)
                
                # User Reaction
                st.markdown("")
                st.markdown('<p style="color: #64748b !important; font-weight: 600; font-size: 0.72rem; letter-spacing: 2px;">HOW WAS YOUR EXPERIENCE?</p>', unsafe_allow_html=True)
                render_lottie("Linkedin Reactions.lottie", height=90, loop=True, speed=0.6)
                
                reaction_cols = st.columns(5)
                reactions = ["👍 Helpful", "❤️ Love it", "🎉 Amazing", "🤔 Confusing", "💡 Insightful"]
                for i, r in enumerate(reactions):
                    with reaction_cols[i]:
                        if st.button(r, key=f"react_{i}", use_container_width=True):
                            st.session_state.user_rating = r
                            st.toast(f"Thanks for the feedback: {r}", icon="✨")

    # ============================================================
    # DATA INSIGHTS (always visible on Step 3)
    # ============================================================
    st.divider()
    sac.divider(label='Data Insights', icon='bar-chart-line', align='center', color='violet')
    
    df = st.session_state.df
    target = st.session_state.target_col
    numeric_cols = df.select_dtypes(include='number').columns.tolist()
    
    # Quick Stats Row
    st.markdown('<p style="color: #64748b !important; font-weight: 600; font-size: 0.72rem; letter-spacing: 2px; margin-bottom: 0.5rem;">DATASET SUMMARY</p>', unsafe_allow_html=True)
    ds_cols = st.columns(5)
    ds_cols[0].metric("Total Samples", f"{len(df):,}")
    ds_cols[1].metric("Features Used", f"{len(st.session_state.feature_cols)}")
    ds_cols[2].metric("Missing Values", f"{df[st.session_state.feature_cols].isnull().sum().sum()}")
    ds_cols[3].metric("Target Classes", f"{df[target].nunique()}")
    ds_cols[4].metric("Numeric Cols", f"{len(numeric_cols)}")
    
    st.markdown("")
    
    # Two Visualizations Side by Side
    viz_col1, viz_col2 = st.columns(2)
    
    with viz_col1:
        st.markdown('<p style="color: #94a3b8 !important; font-weight: 600; font-size: 0.72rem; letter-spacing: 2px;">TARGET CLASS DISTRIBUTION</p>', unsafe_allow_html=True)
        if target in df.columns:
            value_counts = df[target].value_counts()
            pie_data = [{"name": str(k), "value": int(v)} for k, v in value_counts.items()]
            
            pie_opts = {
                "tooltip": {"trigger": "item", "formatter": "{b}: {c} ({d}%)"},
                "legend": {"bottom": "2%", "left": "center", "textStyle": {"color": "#94a3b8", "fontSize": 11}},
                "series": [{"name": target, "type": "pie", "radius": ["42%", "72%"], "center": ["50%", "45%"],
                    "itemStyle": {"borderRadius": 10, "borderColor": "#030711", "borderWidth": 3},
                    "label": {"show": True, "position": "inside", "formatter": "{d}%", "color": "#fff", "fontSize": 11, "fontWeight": "bold"},
                    "emphasis": {"label": {"show": True, "fontSize": 18, "fontWeight": "bold", "color": "#f1f5f9"}, "itemStyle": {"shadowBlur": 20, "shadowColor": "rgba(139,92,246,0.3)"}},
                    "labelLine": {"show": False}, "data": pie_data,
                    "color": ["#8B5CF6", "#50E3C2", "#4A90E2", "#FF6B6B", "#F7B733"],
                    "animationType": "scale", "animationEasing": "elasticOut", "animationDelay": 200}],
                "backgroundColor": "transparent"
            }
            st_echarts(options=pie_opts, height="320px")
    
    with viz_col2:
        st.markdown('<p style="color: #94a3b8 !important; font-weight: 600; font-size: 0.72rem; letter-spacing: 2px;">FEATURE CORRELATION MATRIX</p>', unsafe_allow_html=True)
        if len(numeric_cols) >= 2:
            corr = df[numeric_cols].corr()
            cols_show = corr.columns.tolist()[:12]
            heat_data = []
            for i, row in enumerate(cols_show):
                for j, col in enumerate(cols_show):
                    heat_data.append([j, i, round(float(corr.loc[row, col]), 2)])
            
            heatmap_opts = {
                "tooltip": {"position": "top", "formatter": "{c}"},
                "grid": {"height": "72%", "top": "5%", "left": "18%", "right": "8%"},
                "xAxis": {"type": "category", "data": cols_show, "splitArea": {"show": True}, "axisLabel": {"color": "#64748b", "rotate": 50, "fontSize": 8}},
                "yAxis": {"type": "category", "data": cols_show, "splitArea": {"show": True}, "axisLabel": {"color": "#64748b", "fontSize": 8}},
                "visualMap": {"min": -1, "max": 1, "calculable": True, "orient": "horizontal", "left": "center", "bottom": "0%", "itemWidth": 12, "itemHeight": 100, "inRange": {"color": ["#FF6B6B", "#1e293b", "#50E3C2"]}, "textStyle": {"color": "#64748b", "fontSize": 10}},
                "series": [{"name": "Corr", "type": "heatmap", "data": heat_data, "label": {"show": len(cols_show) <= 8, "color": "#94a3b8", "fontSize": 8}, "emphasis": {"itemStyle": {"borderColor": "#8B5CF6", "borderWidth": 2}}, "animationDelay": 300}],
                "backgroundColor": "transparent"
            }
            st_echarts(options=heatmap_opts, height="320px")
        else:
            st.info("Need 2+ numeric columns for correlation.")

# ============================================================
# FLOATING CHAT BUBBLE (always visible)
# ============================================================

# ============================================================
# CHATBOT MODAL DILAOG
# ============================================================

@st.dialog("🤖 AI Clinical Assistant", width="large")
def chat_modal():
    # Panel Header
    st.markdown("""
    <div style="background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(80,227,194,0.06)); border-radius: 12px; padding: 0.8rem 1.2rem; margin-bottom: 1rem; border: 1px solid rgba(139,92,246,0.1);">
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #50E3C2; box-shadow: 0 0 6px rgba(80,227,194,0.5);"></span>
                <span style="color: #f1f5f9; font-weight: 700;">Multi-Provider Mode</span>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)
    
    from chatbot_agent import PROVIDERS, GEMINI_MODELS, OPENROUTER_MODELS, detect_ollama_models, init_chatbot, reset_chatbot, get_chatbot_response
    from langchain_core.messages import HumanMessage, AIMessage
    
    # ── Setup Mode ──
    if not st.session_state.api_key_set:
        st.markdown("""
        <div style="padding: 0.7rem 1rem; border-radius: 12px; background: rgba(139,92,246,0.04); border: 1px solid rgba(139,92,246,0.12); margin-bottom: 1rem;">
            <p style="color: #94a3b8 !important; font-size: 0.8rem; margin: 0;">
                🔐 API keys stay <strong>in your browser session only</strong> — never stored on server.
            </p>
        </div>
        """, unsafe_allow_html=True)
        
        provider = st.selectbox("🌐 LLM Provider", list(PROVIDERS.keys()), index=0,
            help="Gemini = Google AI · OpenRouter = Free models · Ollama = Run locally")
        
        p1, p2 = st.columns(2)
        
        with p1:
            needs_key = PROVIDERS[provider]["needs_key"]
            if needs_key:
                placeholder = "Google AI Studio key" if provider == "Google Gemini" else "OpenRouter API key"
                api_input = st.text_input("🔑 API Key", type="password", placeholder=placeholder)
            else:
                api_input = ""
                st.info("🖥️ Ollama runs locally. Start `ollama serve` and ensure models are pulled (e.g., `ollama pull gemma3:4b`).")
        
        with p2:
            if provider == "Google Gemini":
                model_choice = st.selectbox("🧠 Model", list(GEMINI_MODELS.keys()), format_func=lambda x: GEMINI_MODELS.get(x, x))
            elif provider == "OpenRouter":
                model_choice = st.selectbox("🧠 Model", list(OPENROUTER_MODELS.keys()), format_func=lambda x: OPENROUTER_MODELS.get(x, x))
            else:
                ollama_models = detect_ollama_models()
                if ollama_models:
                    model_choice = st.selectbox("🧠 Local Model", ollama_models)
                else:
                    st.warning("No models found. Run: `ollama pull gemma3:4b`")
                    model_choice = None
        
        if st.button("✨ Connect & Start Chatting", use_container_width=True):
            if needs_key and not api_input:
                st.warning("Please enter an API key.")
            elif provider == "Ollama (Local)" and not model_choice:
                st.warning("No Ollama model available.")
            else:
                st.session_state.chat_api_key = api_input
                st.session_state.chat_model = model_choice
                st.session_state.chat_provider = provider
                report_ctx = st.session_state.get('last_report', '') or ''
                init_chatbot(report_ctx)
                st.session_state.api_key_set = True
                st.rerun()
    
    # ── Active Chat Mode ──
    else:
        # Controls row
        c1, c2, c3 = st.columns([3, 2, 1])
        with c1:
            provider = st.session_state.get('chat_provider', 'Google Gemini')
            if provider == "Google Gemini":
                model_list = list(GEMINI_MODELS.keys())
            elif provider == "OpenRouter":
                model_list = list(OPENROUTER_MODELS.keys())
            else:
                model_list = detect_ollama_models() or [st.session_state.get('chat_model', '')]
            
            curr = st.session_state.get('chat_model', model_list[0] if model_list else '')
            idx = model_list.index(curr) if curr in model_list else 0
            new_model = st.selectbox("Model", model_list, index=idx, label_visibility="collapsed")
            if new_model != curr:
                st.session_state.chat_model = new_model
                st.rerun()
        with c2:
            report_ctx = st.session_state.get('last_report', '') or ''
            if report_ctx:
                init_chatbot(report_ctx)
                prov_icon = PROVIDERS.get(provider, {}).get("icon", "")
                st.markdown(f'<span style="color: #50E3C2 !important; font-size: 0.72rem;">{prov_icon} Report loaded</span>', unsafe_allow_html=True)
            else:
                st.markdown('<span style="color: #64748b !important; font-size: 0.72rem;">No report yet</span>', unsafe_allow_html=True)
        with c3:
            if st.button("🔄 Reset", help="Clear conversation history", use_container_width=True):
                reset_chatbot()
                st.rerun()
        
        # Cooldown text helper
        import time as _time
        last_t = st.session_state.get('_last_chat_time', 0)
        from chatbot_agent import RATE_LIMITS
        cd = RATE_LIMITS.get(provider, 3)
        remaining = max(0, cd - (_time.time() - last_t))
        if remaining > 0:
            st.caption(f"Rate limiting active: Please wait {int(remaining)}s")
        
        st.divider()
        
        # Chat History container
        chat_container = st.container(height=350)
        with chat_container:
            for msg in st.session_state.get("chat_history", []):
                if isinstance(msg, HumanMessage):
                    with st.chat_message("user", avatar="👤"):
                        st.markdown(msg.content)
                elif isinstance(msg, AIMessage):
                    with st.chat_message("assistant", avatar="🤖"):
                        st.markdown(msg.content)
        
        # Chat Input
        user_in = st.chat_input("Ask about your diagnosis, SHAP values, or health questions...")
        if user_in:
            with chat_container:
                with st.chat_message("user", avatar="👤"):
                    st.markdown(user_in)
                with st.chat_message("assistant", avatar="🤖"):
                    with st.spinner("Thinking..."):
                        response = get_chatbot_response(
                            user_in,
                            st.session_state.get('chat_provider', 'Google Gemini'),
                            st.session_state.get('chat_api_key', ''),
                            st.session_state.get('chat_model', 'gemini-2.0-flash')
                        )
                        st.markdown(response)
            st.rerun()

# ============================================================
# CHAT TRIGGER
# ============================================================
st.markdown("<br><br>", unsafe_allow_html=True)
sac.divider(label='AI Interactivity', icon='robot', align='center', color='indigo')

colA, colB, colC = st.columns([1, 2, 1])
with colB:
    if st.button("💬 Open AI Clinical Assistant", use_container_width=True, type="primary"):
        chat_modal()

