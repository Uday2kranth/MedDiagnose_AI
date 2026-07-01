# MedDiagnose AI — Technical Project Report & Documentation

## 1. Executive Summary & Problem Statement
Clinical decision-making tools that employ Machine Learning (ML) face dual hurdles of opacity and communication gaps. Clinicians are hesitant to trust "black-box" model outputs, and patients struggles to understand numerical probabilities or regression scores.

**MedDiagnose AI** bridges these gaps. It provides:
1. **Adaptive ML Engine:** Auto-detects target data types to perform either classification or regression using XGBoost.
2. **Explainable AI (XAI):** Renders Shapley Additive Explanations (SHAP) to attribute local feature impact for individual patient cases, as well as global feature significance.
3. **Conversational Interface:** Leverages LangChain to interact with medical providers, explain clinical outputs, and automatically email formatted patient reports via Gmail OAuth2.
4. **Academic R Pipeline:** A separate offline R script executing IQR outlier cleaning, descriptive statistics, and hypothesis tests (Chi-Square, t-test, ANOVA) for scholarly validity.

---

## 2. Project Architecture & Connection Flow
The architecture consists of:
*   **React + Vite Frontend:** Interactive dashboards, sliders, visualizations, and settings panel.
*   **FastAPI Backend Server:** Coordinates training/inference pipelines, SHAP computation, plot generation, and chatbot execution.
*   **Academic R Script:** Non-production statistical validation suite.
*   **External APIs:**
    *   **OpenRouter API:** Proxies access to free/premium LLMs.
    *   **Gmail API:** Standardized OAuth2 client to safely send diagnostic reports.

---

## 3. Directory Layout
The project directory structure is designed to isolate the Python FastAPI backend, the React-Vite frontend, and the standalone R statistics codebase:
```text
Uday_major_project/
├── app_fastapi.py            # Main FastAPI endpoints & in-memory state
├── chatbot_agent.py          # LangChain orchestrator & OpenRouter config
├── ml_pipeline.py            # XGBoost classification/regression pipeline
├── xai_explainer.py          # SHAP calculation & direction parsing
├── email_tool.py             # OAuth2 Gmail dispatch client
├── report_export.py          # Exporter for MD, TXT, PDF, and DOCX reports
├── Rogramming for eda.../
│   ├── academic_pipeline.R   # Statistical cleaning & hypothesis scripts
│   └── README.md             # R setup instructions
└── frontend/
    └── src/                  # React components and dashboard UI
```

---

## 4. Academic R Statistics Pipeline (`academic_pipeline.R`)
Used for data prep and formal academic validation on patient datasets like `diabetes.csv`.
1.  **IQR Outlier Filtering:** Calculates $Q_1$ and $Q_3$, removing continuous values exceeding $[Q_1 - 1.5 \times IQR, Q_3 + 1.5 \times IQR]$.
2.  **Descriptive Summary:** Calculates mean, median, variance, skewness, and excess kurtosis without external library dependencies.
3.  **Hypothesis Tests:**
    *   *Chi-Square Test:* Discretizes age groups to evaluate contingency against binary patient outcomes.
    *   *Welch's Independent t-test:* Evaluates differences in continuous indicators (e.g., glucose) across binary outcome groups.
    *   *One-Way ANOVA:* Evaluates continuous attributes (e.g., BMI) across categorical groups.

---

## 5. Machine Learning Pipeline (`ml_pipeline.py`)
Features an auto-adaptive architecture:
*   **Task Auto-Detection:** Examines target cardinality and data types. Category-based attributes or unique values $\le 15$ default to classification; others default to regression.
*   **Feature Preprocessing:** ColumnTransformers handle numeric variables (SimpleImputer with median strategy, StandardScaler) and categorical variables (SimpleImputer with "Unknown", OneHotEncoder).
*   **XGBoost Training:** Fits `XGBClassifier` or `XGBRegressor` on a $80/20$ train-test split and extracts relevant accuracy/error metrics.

---

## 6. Explainable AI & SHAP (`xai_explainer.py`)
Computes Shapley values using `shap.TreeExplainer` on the fitted XGBoost pipeline.
*   **Local SHAP Values:** Extracts the exact impact of each input variable on an individual patient's prediction.
*   **Impact Direction Analysis:** Parses the sign of the SHAP values to explain whether a patient's measurement increases or decreases their predicted clinical risk.

---

## 7. Conversational Chatbot & OpenRouter Integration (`chatbot_agent.py`)
Implements a LangChain-based conversational agent:
*   **System Prompt Boundary:** Constrains the AI strictly to medical-domain questions. It rejects general-interest topics while actively explaining diagnosis factors and prediction trends.
*   **OpenRouter Routing:** Connects to `https://openrouter.ai/api/v1` via an OpenAI-compatible adapter, providing unified access to free and premium open-weights models (e.g., Llama-3, Qwen, DeepSeek).
*   **Tool Calling:** Automatically binds the custom Gmail dispatch tool (`send_email_tool`), executing email reports when prompted.
