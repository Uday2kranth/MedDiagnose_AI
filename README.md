---
title: MedDiagnose AI
emoji: 🧬
colorFrom: indigo
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# MedDiagnose AI — Clinical ML Prediction, XAI Explainability & Conversational Diagnostic Agent

[![Live App](https://img.shields.io/badge/Live_App-Railway-blue?style=for-the-badge)](https://meddiagnoseai-production.up.railway.app)

MedDiagnose AI is a full-stack, dual-language clinical intelligence platform that lets medical professionals upload any healthcare CSV dataset, automatically trains an XGBoost machine learning model (classification or regression), generates real-time SHAP-powered explanations for every prediction, and connects a structured conversational AI agent capable of interpreting results and emailing diagnostic reports to patients. The platform features a premium React + Vite frontend with a space-themed glassmorphic UI, a FastAPI Python backend, and a standalone R statistics pipeline for academic compliance.

---

## Table of Contents

1. [Project Overview & Problem Statement](#1-project-overview--problem-statement)
2. [System Architecture & Connection Flow](#2-system-architecture--connection-flow)
3. [Repository Directory Structure](#3-repository-directory-structure)
4. [Prerequisites & Environment Installation](#4-prerequisites--environment-installation)
5. [How to Train the Models / Prepare Assets](#5-how-to-train-the-models--prepare-assets)
6. [How to Run the Application](#6-how-to-run-the-application)
7. [Detailed Component Breakdown](#7-detailed-component-breakdown)

---

## 1. Project Overview & Problem Statement

### The Real-World Problem

Clinical predictive systems built for patient diagnosis or cost estimation have historically suffered from two critical failures:

1. **Black-box opacity** — ML models generate predictions without explaining *why*, leaving clinicians unable to justify or trust model outputs in life-affecting decisions.
2. **Communication gap** — Patients and non-technical staff cannot extract actionable insight from raw probability scores or regression values, and diagnostic summaries are rarely communicated efficiently.

MedDiagnose AI directly solves both problems by pairing every prediction with a SHAP (Shapley Additive Explanations) breakdown and connecting the results to a conversational AI agent that can explain findings in plain language and dispatch styled clinical reports via Gmail.

---

### Engineering & Machine Learning Goals

| Goal | Implementation |
|:---|:---|
| **Auto-adaptive ML pipeline** | Detects whether the uploaded CSV requires Classification or Regression and automatically selects the correct XGBoost model |
| **Per-patient explainability** | Computes individual SHAP values using `shap.TreeExplainer`, exposing the exact contribution of each patient feature |
| **Global feature importance** | Aggregates SHAP values across a dataset sample to surface overall risk drivers |
| **Conversational AI agent** | Uses LangChain `create_agent` with tool-calling to let a medical chatbot interpret predictions and dispatch email reports |
| **EDA Visualizations** | Generates Python Matplotlib distribution plots and a Pearson correlation heatmap server-side, encoded as Base64 PNG |
| **Academic R pipeline** | Provides a standalone R script for data cleaning, descriptive stats, and hypothesis testing for academic submission |
| **Multi-provider LLM support** | Currently supports **OpenRouter** (25+ free models) and **NVIDIA NIM** (9 premium models), with full API key management via the UI |

---

### Primary User Personas

- **Clinicians & Medical Analysts** — Upload clinical datasets, train models in one click, inspect real-time patient predictions by adjusting health sliders, and view SHAP feature bars.
- **Patients** — Receive AI-composed diagnostic email summaries explaining their prediction and clinical recommendations.
- **Academic Evaluators / Examiners** — Run the standalone R statistics script to inspect raw statistical computations presented separately from the Python application.

---

## 2. System Architecture & Connection Flow

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     MEDDIAGNOSE AI — SYSTEM ARCHITECTURE                │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────┐         HTTP REST (JSON)
  │   React + Vite Client        │ ◄──────────────────────────────────────┐
  │   localhost:5173             │                                         │
  │                              │ ── POST /api/columns ──────────────────►│
  │  • UploadScreen              │ ── POST /api/upload ───────────────────►│
  │  • ColumnPicker              │ ── POST /api/predict ──────────────────►│
  │  • Dashboard (StatsRow,      │ ── GET  /api/eda ───────────────────────►│
  │    PatientForm, ResultPanel) │ ── GET  /api/sample ───────────────────►│
  │  • XAIExplorer               │ ── GET  /api/xai-global ───────────────►│
  │  • ReportPanel               │ ── GET  /api/report ───────────────────►│
  │  • EDADashboard              │ ── POST /api/chat ──────────────────────►│
  │  • ChatDrawer                │ ── GET  /api/health ───────────────────►│
  └──────────────────────────────┘                                         │
                                                                           ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │              FastAPI Backend Server — localhost:8000                    │
  │                        app_fastapi.py                                   │
  │                                                                         │
  │  In-memory state: { pipeline, le, X_train, df, metrics,                │
  │                     task_type, chat_history, feature_stats }            │
  │                                                                         │
  │  Calls:                                                                 │
  │  ├── ml_pipeline.py  ──────── XGBoost Training / Inference             │
  │  ├── xai_explainer.py ─────── SHAP Value Computation                   │
  │  ├── chatbot_agent.py ─────── LangChain Agent Build                    │
  │  └── report_export.py ─────── .md / .txt / PDF / Docx Export           │
  └───────────┬──────────────────────────┬───────────────────────────────┬─┘
              │                          │                               │
              ▼                          ▼                               ▼
  ┌──────────────────┐     ┌─────────────────────────────┐   ┌─────────────────────┐
  │  OpenRouter API  │     │     NVIDIA NIM API          │   │  Google Gmail API   │
  │  (via HTTPS)     │     │  integrate.api.nvidia.com   │   │  (OAuth2 / token)   │
  │  openrouter.ai   │     │  25+ free models in UI      │   │  email_tool.py      │
  └──────────────────┘     └─────────────────────────────┘   └─────────────────────┘

  ┌─────────────────────────────────────────────┐
  │  Standalone R Script (offline / academic)    │
  │  Rogramming for eda and data cleaning/       │
  │  academic_pipeline.R                         │
  │  Reads: diabetes.csv  → Writes: cleaned_data.csv │
  └─────────────────────────────────────────────┘
```

### Connection Mechanism Details

| Layer | Technology | Port | Protocol |
|:---|:---|:---|:---|
| **React Frontend** | Vite + React 19 | `5173` | HTTP (Axios) |
| **FastAPI Backend** | Python + Uvicorn | `8000` | HTTP REST (JSON) |
| **LLM API — OpenRouter** | HTTPS | `443` | REST → `https://openrouter.ai/api/v1` |
| **LLM API — NVIDIA NIM** | HTTPS | `443` | REST → `https://integrate.api.nvidia.com/v1` |
| **Gmail Email API** | Google OAuth2 | `443` | MIME over Gmail REST API |

- **CORS:** FastAPI is configured with `allow_origins=["*"]` to allow the Vite dev server on `localhost:5173` to make cross-origin requests to `localhost:8000`.
- **In-Memory State:** The FastAPI server holds all application state in a Python `state` dictionary. There is no database. All uploaded datasets, trained models, and chat histories live in-process — restarting the server clears the state.
- **Base64 EDA Delivery:** The `/api/eda` endpoint generates Matplotlib charts in memory, encodes them as Base64 PNG strings, and returns them inside a JSON object. The React client decodes them directly into `<img>` tags using `data:image/png;base64,...` src strings.
- **Real-Time Inference:** The React frontend debounces patient slider changes by 500ms using a custom `useDebounce` hook. On each stable change, it posts the full patient input to `/api/predict`, which runs a SHAP computation and returns results within milliseconds.

---

## 3. Repository Directory Structure

```
d:/sem3/excel/numpy/Uday_major_project/
│
├── app_fastapi.py             ← Main FastAPI server: all API routes, in-memory state, EDA plots, chat handler
├── chatbot_agent.py           ← LangChain agent: LLM providers, model registries, system prompt, tool binding
├── ml_pipeline.py             ← XGBoost training: auto task detection, preprocessing, train/test split, metrics
├── xai_explainer.py           ← SHAP computation: TreeExplainer, top features summary, impact direction labels
├── email_tool.py              ← Gmail API tool: OAuth2 auth, HTML email builder, mock log fallback
├── gmail_setup.py             ← One-time OAuth2 setup script: browser-based Google consent flow
├── report_export.py           ← Document exporter: Markdown, plain text, PDF (fpdf), Word (.docx)
├── test_datasets.py           ← Integration test client: validates upload, training, and prediction endpoints
├── app.py                     ← Legacy Streamlit app (historical, not the primary frontend)
├── patch.py                   ← One-time migration utility (not needed for runtime)
├── main.py                    ← Empty module file
│
├── requirements.txt           ← Python dependencies: FastAPI, XGBoost, SHAP, LangChain, Google APIs, Matplotlib
├── pyproject.toml             ← Python project configuration for packaging tools
├── uv.lock                    ← Locked dependency versions for reproducible installs with uv
├── .python-version            ← Pins local Python version to 3.10 for pyenv or uv compatibility
│
├── .env                       ← Local environment variables (API keys — never commit this file)
├── credentials.json           ← Google OAuth2 Desktop App credentials (download from Google Cloud Console)
├── token.json                 ← Auto-generated OAuth2 token after running gmail_setup.py
├── sent_emails.log            ← Audit log: captures all email drafts (mock mode and real delivery)
│
├── diabetes.csv               ← Default classification dataset: 768 patients, 8 features, binary Outcome target
├── breast_cancer.csv          ← Optional classification dataset: breast cancer patient features
├── synthetic_health_data.csv  ← Optional synthetic dataset for testing the platform with any dataset
├── boston_housing_test.csv    ← Optional regression dataset: tests the regression pipeline end-to-end
│
├── checklater/                ← Saved resources for reference and deployment
│   ├── DEPLOYMENT.md          ← Deployment guide and option breakdown
│   └── Demonstration_Test_Cases.md ← Test cases for verifying platform capabilities
│
├── Rogramming for eda and data cleaning/
│   ├── academic_pipeline.R   ← Standalone R script: IQR cleaning, descriptive stats, Chi-Square, t-test, ANOVA
│   └── README.md              ← Guide to running the R pipeline locally without RStudio
│
└── frontend/                  ← React + Vite client application
    ├── package.json           ← Node.js package manifest: dependencies, dev scripts (dev/build/preview)
    ├── package-lock.json      ← Locked npm dependency tree for reproducible installs
    ├── index.html             ← Root HTML shell: mounts React to <div id="root">
    ├── vite.config.js         ← Vite bundler configuration with React plugin
    ├── eslint.config.js       ← ESLint rules enforcing React hooks and refresh conventions
    ├── public/                ← Static assets served directly by Vite (favicon, etc.)
    └── src/
        ├── main.jsx           ← React entry point: renders <App /> into the DOM root
        ├── App.jsx            ← Root orchestrator: all global state, debounced inference, tab routing, API calls
        ├── App.css            ← Layout styles: grid system, dashboard, report cards, radar chart
        ├── index.css          ← Design tokens: colors, fonts, glassmorphic effects, keyframe animations
        ├── assets/            ← Static images and font resources
        └── components/
            ├── Background.jsx     ← Space particle backdrop: nebulae, shooting stars, alien sun, star field
            ├── Navbar.jsx         ← Top navigation bar: tab links, backend connection health dot indicator
            ├── TabNav.jsx         ← Animated tab pill navigation with framer-motion layout spring indicator
            ├── UploadScreen.jsx   ← Drag-and-drop CSV uploader with pulsing ring animation
            ├── ColumnPicker.jsx   ← Target column selector with dataset preview table
            ├── StatsRow.jsx       ← Model metrics row: Accuracy (classification) or R²/MAE (regression)
            ├── PatientForm.jsx    ← Dynamic feature input form with "Load Sample Patient" button
            ├── ResultPanel.jsx    ← Prediction output: confidence ring (classification) or value cards (regression)
            ├── XAIExplorer.jsx    ← SHAP bar charts: local per-patient and global dataset-wide importance
            ├── ReportPanel.jsx    ← Patient report: Radar chart, SHAP table, PDF export, AI Clinical Summary
            ├── EDADashboard.jsx   ← EDA Visualizations: distribution plots + correlation heatmap (Base64 PNG)
            ├── ChatDrawer.jsx     ← AI chat drawer: provider/model/API key settings, message thread
            ├── Typewriter.jsx     ← State-driven character printer: renders AI text without skipping letters
            └── SkeletonLoader.jsx ← Shimmer placeholder cards shown during loading states
```

---

## 4. Prerequisites & Environment Installation

### Required Software

| Software | Minimum Version | Check Command | Purpose | Download |
|:---|:---:|:---|:---|:---|
| **Python** | 3.10+ | `python --version` | Runs FastAPI server and all ML/AI scripts | [python.org](https://www.python.org/downloads/) |
| **pip** | 21+ | `pip --version` | Installs Python packages | Bundled with Python |
| **Node.js** | 18+ | `node --version` | Compiles and serves the React frontend | [nodejs.org](https://nodejs.org/) |
| **npm** | 9+ | `npm --version` | Installs frontend JavaScript packages | Bundled with Node.js |
| **R** *(Academic only)* | 4.0+ | `R --version` | Executes standalone R statistics pipeline | [r-project.org](https://www.r-project.org/) |

> **Windows note:** When installing Python, tick the **"Add Python to PATH"** checkbox on the installer. Use **PowerShell** or **Windows Terminal** (not the legacy CMD) for best compatibility.

---

### Step A: Python Backend Setup

Open a terminal and navigate to the project root folder:

```
d:\sem3\excel\numpy\Uday_major_project\
```

#### A1 — Create a Virtual Environment

| Shell | Command |
|:---|:---|
| Windows Command Prompt | `python -m venv .venv` |
| Windows PowerShell | `python -m venv .venv` |
| macOS / Linux | `python3 -m venv .venv` |

#### A2 — Activate the Virtual Environment

| Shell | Command |
|:---|:---|
| Windows Command Prompt | `.venv\Scripts\activate.bat` |
| Windows PowerShell | `.venv\Scripts\Activate.ps1` |
| macOS / Linux | `source .venv/bin/activate` |

> **PowerShell tip:** If you see a policy error, run this first:
> `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process`

Once activated, your terminal prompt will begin with `(.venv)`.

#### A3 — Install Python Dependencies

```bash
pip install -r requirements.txt
```

This installs the following core packages (among others):

| Package | Role |
|:---|:---|
| `fastapi` + `uvicorn[standard]` | ASGI web server and REST framework |
| `pandas` + `numpy` | Data manipulation and numeric computation |
| `scikit-learn` | ML preprocessing pipelines (imputer, scaler, encoder) |
| `xgboost` | XGBoost Classifier and Regressor |
| `shap` | TreeExplainer for per-patient and global SHAP values |
| `langchain` + `langchain-openai` | LangChain agent orchestration with tool-calling |
| `matplotlib` | Server-side plot generation for EDA visualizations |
| `google-api-python-client` | Gmail API client for email delivery |
| `fpdf2` + `python-docx` | PDF and Word document report export |
| `python-multipart` | Required for FastAPI file upload form handling |

#### A4 — Configure Environment Variables

Create a `.env` file in the project root (if it does not already exist) and add your LLM API keys:

```env
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key-here
NVIDIA_NIM_API_KEY=nvapi-your-nvidia-nim-key-here
```

> **Note:** API keys are entered live through the **Settings (⚙️)** panel inside the chat drawer UI. The `.env` file is optional and for pre-configuration only.

---

### Step B: React Frontend Setup

Open a **second terminal** and navigate to the `frontend/` directory:

```bash
cd "d:\sem3\excel\numpy\Uday_major_project\frontend"
```

#### B1 — Install Node.js Packages

```bash
npm install
```

This installs the following runtime dependencies declared in [`package.json`](file:///d:/sem3/excel/numpy/Uday_major_project/frontend/package.json):

| Package | Version | Purpose |
|:---|:---:|:---|
| `react` + `react-dom` | 19.2.4 | Core React framework and DOM rendering |
| `axios` | 1.15.0 | HTTP REST client for API communication |
| `framer-motion` | 12.38.0 | Spring physics animations and transitions |
| `recharts` | 3.8.1 | Radar charts and data visualization |
| `lucide-react` | 1.8.0 | Icon library (settings, chart, activity icons) |
| `html2pdf.js` | 0.14.0 | Client-side PDF export for patient reports |
| `vite` | 8.0.4 | Ultra-fast frontend build tool and dev server |

---

### Step C: R Environment Setup *(Academic / Optional)*

Install required R packages. Run this command inside an R console or your system terminal:

```r
install.packages(c("dplyr", "stats"), repos = "https://cloud.r-project.org")
```

> **Note:** The `stats` package is part of R base and is almost always pre-installed. Only `dplyr` requires explicit installation.

---

## 5. How to Train the Models / Prepare Assets

### Option A: R Data Cleaning Pipeline *(Academic Use)*

The standalone R script at [`Rogramming for eda and data cleaning/academic_pipeline.R`](file:///d:/sem3/excel/numpy/Uday_major_project/Rogramming%20for%20eda%20and%20data%20cleaning/academic_pipeline.R) provides a self-contained academic analysis. It:

1. Reads `diabetes.csv` from the parent directory (`../diabetes.csv`)
2. Drops rows with NA values using `drop_na()`
3. Applies IQR-based outlier removal to all 7 continuous predictors (`Glucose`, `BloodPressure`, `SkinThickness`, `Insulin`, `BMI`, `DiabetesPedigreeFunction`, `Age`)
4. Exports a cleaned dataset to `cleaned_data.csv` one directory up
5. Computes Mean, Median, Variance, Skewness, and Excess Kurtosis for each feature
6. Runs three hypothesis tests:
   - **Chi-Square test** — Age Group (Young/Middle-aged/Senior) vs. Diabetes Outcome
   - **Welch's Independent t-test** — Glucose levels between Outcome = 0 and Outcome = 1 groups
   - **One-Way ANOVA** — BMI distribution across Age Groups

> [!TIP]
> For a detailed walkthrough on setting up R, adding Rscript to your PATH, and running this pipeline via PowerShell, Command Prompt, or VS Code without RStudio, see the dedicated [R README.md](file:///d:/sem3/excel/numpy/Uday_major_project/Rogramming%20for%20eda%20and%20data%20cleaning/README.md).

**To run the R pipeline:**

```bash
# Navigate to the R script directory
cd "d:\sem3\excel\numpy\Uday_major_project\Rogramming for eda and data cleaning"

# Execute the script
Rscript academic_pipeline.R
```

**Expected output files:**

| File | Location | Contents |
|:---|:---|:---|
| `cleaned_data.csv` | `d:\sem3\excel\numpy\Uday_major_project\cleaned_data.csv` | IQR-filtered version of diabetes.csv |

**Expected terminal output:**

```
======================================================================
R PROGRAMMING: DATA CLEANING & STATISTICAL PIPELINE
======================================================================

[1/3] Loading and Cleaning Data...
Initial dataset dimensions: 768 rows, 9 columns
Cleaned dataset dimensions (after IQR outlier removal): NNN rows
Cleaned data exported successfully to '../cleaned_data.csv'

[2/3] Calculating Descriptive Statistics...
  Feature    Mean  Median  Variance  Skewness  Kurtosis
...

[3/3] Executing Academic Hypothesis Tests...
A. Chi-Square Test (Age Group vs Outcome):
   X-squared statistic = ...
   p-value = ...

B. Independent t-test (Glucose vs Outcome):
   t-statistic = ...
   p-value = ...

C. One-way ANOVA (BMI across Age Groups):
...

======================================================================
R PIPELINE COMPLETED SUCCESSFULLY
======================================================================
```

---

### Option B: Python ML Model Training *(Automatic — No Manual Step Required)*

The Python XGBoost model is trained **on-demand automatically** through the application workflow. No separate pre-training step is needed:

1. Open the application in your browser at `http://localhost:5173`
2. Drag-and-drop or click to upload a CSV dataset (e.g., `diabetes.csv`)
3. The backend parses the columns via `POST /api/columns`
4. Select your target prediction column on the Column Picker screen
5. Click **"Train Model"** — the backend calls `POST /api/upload`, which invokes [`ml_pipeline.py`](file:///d:/sem3/excel/numpy/Uday_major_project/ml_pipeline.py), trains the XGBoost model, and returns evaluation metrics within seconds

**What the training pipeline does automatically:**
- Detects task type: if the target has ≤ 15 unique values or is non-numeric → **Classification** (XGBClassifier); otherwise → **Regression** (XGBRegressor)
- Applies `SimpleImputer` (median strategy for numeric, constant `'Unknown'` for categorical)
- Applies `StandardScaler` for numeric features and `OneHotEncoder` for categorical features
- 80/20 train/test split with `random_state=42`
- Returns `accuracy` (classification) or `r2`, `mae`, `rmse` (regression)

---

## 6. How to Run the Application

### Method 1: Manual Way (Recommended — Two Terminal Windows)

This method gives you full visibility into backend and frontend logs separately, which is essential for debugging.

#### Terminal 1 — Start the FastAPI Backend

```bash
# Navigate to project root
cd "d:\sem3\excel\numpy\Uday_major_project"

# Activate virtual environment
.venv\Scripts\activate        # Windows CMD
# OR: .venv\Scripts\Activate.ps1   # Windows PowerShell
# OR: source .venv/bin/activate     # macOS/Linux

# Start FastAPI server
python app_fastapi.py
```

You should see:
```
INFO:     Started server process [XXXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

#### Terminal 2 — Start the React Frontend

```bash
# Navigate to frontend directory
cd "d:\sem3\excel\numpy\Uday_major_project\frontend"

# Start Vite development server
npm run dev
```

You should see:
```
  VITE v8.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Open your browser and go to: `http://localhost:5173`**

---

### Method 2: Build for Production (Static Deployment)

If you need a production build (static files that can be served by any web server or CDN):

```bash
cd "d:\sem3\excel\numpy\Uday_major_project\frontend"
npm run build
```

The output goes into `frontend/dist/`. Serve the FastAPI backend separately and point it to serve `dist/` as static files, or deploy the `dist/` folder to any static host (Netlify, Vercel, etc.).

---

### Method 3: Legacy Streamlit App *(Historical — Not Primary)*

The original Streamlit interface in [`app.py`](file:///d:/sem3/excel/numpy/Uday_major_project/app.py) is still present but is not the primary interface.

```bash
cd "d:\sem3\excel\numpy\Uday_major_project"
# Activate venv first
streamlit run app.py
```

Opens at: `http://localhost:8501`

> **Warning:** The chatbot integration in `app.py` may not function correctly as the internal agent APIs have evolved. Use the React + FastAPI stack as the primary interface.

---

### Configuring the AI Chat Provider

Once the application is running in your browser:

1. Run a prediction on a patient (this unlocks the chat bubble in the bottom right)
2. Click the **chat bubble (💬)** to open the chat drawer
3. Click the **Settings gear (⚙️)** icon in the chat header
4. Select your **Provider**:
   - **OpenRouter** — Access 25+ free models (requires an OpenRouter API key from [openrouter.ai](https://openrouter.ai))
   - **NVIDIA NIM** — Access 9 enterprise-grade models (requires an NVIDIA NIM API key from [nvidia.com/nim](https://build.nvidia.com/explore/discover))
5. Select your **Model** from the dropdown
6. Paste your **API Key** into the key field
7. Click **Apply Settings** — the provider is now live

---

### Enabling Gmail Email Delivery *(Optional)*

By default, the email tool runs in **mock mode** — it logs all composed emails to [`sent_emails.log`](file:///d:/sem3/excel/numpy/Uday_major_project/sent_emails.log) without sending anything. To enable real email delivery:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project
2. Enable the **Gmail API**: APIs & Services → Library → search "Gmail API" → Enable
3. Create OAuth2 credentials: APIs & Services → Credentials → Create Credentials → OAuth Client ID → Desktop App → Download JSON
4. Rename the file to `credentials.json` and place it in the project root
5. Run the one-time setup script:

```bash
python gmail_setup.py
```

6. A browser window opens — sign in and grant email permissions
7. A `token.json` file is created in the project root — email delivery is now live

---

## 7. Detailed Component Breakdown

---

### Backend Python Components (Project Root)

---

#### [`app_fastapi.py`](file:///d:/sem3/excel/numpy/Uday_major_project/app_fastapi.py)

**Internal Logic:**
The main ASGI web server and the single point of entry for all client requests. It manages a `state` dictionary holding all in-memory runtime data (pipeline, dataframe, feature statistics, chat history, last prediction result). It validates uploaded datasets before processing — rejecting files with unnamed columns, NaN values, or duplicate rows.

**API Endpoints:**

| Method | Endpoint | Purpose |
|:---|:---|:---|
| `GET` | `/` | Health ping — returns server status string |
| `GET` | `/api/health` | Frontend health check — polled every 8 seconds by React to display connection status dot |
| `POST` | `/api/columns` | Parses uploaded CSV and returns column names + 3-row preview for the Column Picker |
| `POST` | `/api/upload` | Trains the XGBoost model on the uploaded dataset with the selected target column |
| `GET` | `/api/sample` | Returns a random row from the training data for "Load Sample Patient" button |
| `POST` | `/api/predict` | Runs SHAP + model inference on submitted patient feature values |
| `GET` | `/api/xai-global` | Computes mean absolute SHAP values across 100 training rows for the XAI Explorer tab |
| `GET` | `/api/eda` | Generates Matplotlib distribution plots and correlation heatmap; returns as Base64 PNG JSON |
| `GET` | `/api/report` | Generates a downloadable Markdown or plain-text diagnostic report |
| `POST` | `/api/chat` | Routes chat messages through the LangChain agent with the configured LLM provider |

**Key Variables:** `state['pipeline']` (trained scikit-learn Pipeline), `state['df']` (pandas DataFrame), `state['task_type']` (`'classification'` or `'regression'`), `state['chat_history']` (list of LangChain messages), `state['feature_stats']` (min/max/mean per numeric column).

**Integration:** Calls [`ml_pipeline.py`](file:///d:/sem3/excel/numpy/Uday_major_project/ml_pipeline.py) → [`xai_explainer.py`](file:///d:/sem3/excel/numpy/Uday_major_project/xai_explainer.py) → [`chatbot_agent.py`](file:///d:/sem3/excel/numpy/Uday_major_project/chatbot_agent.py). Serves all React HTTP requests.

---

#### [`chatbot_agent.py`](file:///d:/sem3/excel/numpy/Uday_major_project/chatbot_agent.py)

**Internal Logic:**
Manages all LLM provider integrations and the LangChain tool-calling agent. The `SYSTEM_PROMPT` constant enforces medical-only conversation scope, strict spelling standards, and structured response formatting with double-spaced paragraphs. The `format_llm_exception` helper (in `app_fastapi.py`) parses upstream API errors and converts 429 rate limits, 401 auth failures, and connection timeouts into readable user guidance.

**Active Provider Configuration:**

| Provider | API Base URL | Key Needed | Models |
|:---|:---|:---:|:---|
| **OpenRouter** | `https://openrouter.ai/api/v1` | ✅ | 25+ free models including DeepSeek V3, Llama 3.3 70B, GPT-OSS 120B |
| **NVIDIA NIM** | `https://integrate.api.nvidia.com/v1` | ✅ | Llama 3.1 405B, Mixtral 8x22B, Mistral Large, Qwen 3, GLM 5.1, MiniMax M3 |

**Key Functions:**
- `get_llm(provider, api_key, model)` — Factory that returns the correct `langchain_openai.ChatOpenAI` instance configured for the selected provider
- `get_agent_executor(provider, api_key, model)` — Builds a LangChain `create_agent` graph with the email tool bound as a callable action
- `build_system_message(report_context)` — Injects patient prediction context into the system prompt for enhanced report interpretation

**Integration:** Imported by [`app_fastapi.py`](file:///d:/sem3/excel/numpy/Uday_major_project/app_fastapi.py) for the `/api/chat` endpoint. Binds the `send_email_tool` from [`email_tool.py`](file:///d:/sem3/excel/numpy/Uday_major_project/email_tool.py).

---

#### [`ml_pipeline.py`](file:///d:/sem3/excel/numpy/Uday_major_project/ml_pipeline.py)

**Internal Logic:**
Automates the full ML lifecycle. The `detect_task_type(y)` function inspects the pandas target Series dtype and unique value count (threshold: 15). If the target is non-numeric or has ≤ 15 unique values, it routes to Classification. Otherwise, Regression. The preprocessing pipeline uses `SimpleImputer` → `StandardScaler` for numeric columns and `SimpleImputer` → `OneHotEncoder(handle_unknown='ignore')` for categorical columns, wrapped in a `ColumnTransformer`.

**Key Configuration:**

| Parameter | Classification | Regression |
|:---|:---|:---|
| Model | `XGBClassifier(n_estimators=100, eval_metric='logloss')` | `XGBRegressor(n_estimators=100, eval_metric='rmse')` |
| Train/Test Split | 80% / 20%, `random_state=42` | 80% / 20%, `random_state=42` |
| Metrics Returned | `accuracy`, `samples`, `features`, `n_classes` | `r2`, `mae`, `rmse`, `samples`, `features` |

**Integration:** Called exclusively by [`app_fastapi.py`](file:///d:/sem3/excel/numpy/Uday_major_project/app_fastapi.py) during the `POST /api/upload` handler.

---

#### [`xai_explainer.py`](file:///d:/sem3/excel/numpy/Uday_major_project/xai_explainer.py)

**Internal Logic:**
Uses `shap.TreeExplainer` initialized on the extracted XGBoost model step from the scikit-learn pipeline. It preprocesses the input row through the pipeline's `ColumnTransformer`, then applies the explainer to the transformed matrix. Feature names are reconstructed from the preprocessor's numeric column list and `OneHotEncoder.get_feature_names_out()`. For multiclass classification, it selects SHAP values for the predicted class.

**Key Functions:**
- `generate_shap_values(pipeline, X_input, X_train)` → Returns `(explainer, shap_explanation, X_transformed, feature_names)`
- `get_top_features_summary(shap_explanation, feature_names, top_n=5, task_type)` → Returns a formatted string listing the top 5 features with their impact direction and magnitude

**Integration:** Called twice per prediction in `app_fastapi.py` — once for individual patient SHAP (`/api/predict`) and once for global importance averaging (`/api/xai-global`).

---

#### [`email_tool.py`](file:///d:/sem3/excel/numpy/Uday_major_project/email_tool.py)

**Internal Logic:**
Implements the `@tool`-decorated `send_email_tool` function used by the LangChain agent. When the agent decides to send an email (triggered by user command like "email my report to patient@example.com"), it calls this tool. The function:
1. **Always** appends the full email to `sent_emails.log` (audit trail)
2. Tries `_get_gmail_service()` which reads `token.json` for OAuth2 credentials
3. If valid, sends a styled HTML MIME email via `service.users().messages().send()`
4. If token is missing or expired, returns a helpful setup message pointing to `gmail_setup.py`

**Integration:** Imported and bound by [`chatbot_agent.py`](file:///d:/sem3/excel/numpy/Uday_major_project/chatbot_agent.py) as a callable tool in the LangChain agent.

---

#### [`gmail_setup.py`](file:///d:/sem3/excel/numpy/Uday_major_project/gmail_setup.py)

**Internal Logic:**
A one-time interactive CLI script. It reads `credentials.json` using `google_auth_oauthlib.flow.InstalledAppFlow`, initiates a local redirect server on a random port, opens your browser to Google's OAuth2 consent screen, and writes the resulting access + refresh token to `token.json`.

**Run it once before using the email feature:**
```bash
python gmail_setup.py
```

---

#### [`report_export.py`](file:///d:/sem3/excel/numpy/Uday_major_project/report_export.py)

**Internal Logic:**
Converts the `state['last_result']` prediction dictionary and patient input values into downloadable file formats. Supports four output types: Markdown (`.md`), plain text (`.txt`), PDF via `fpdf2`, and Word Document via `python-docx`.

**Integration:** Invoked by [`app_fastapi.py`](file:///d:/sem3/excel/numpy/Uday_major_project/app_fastapi.py) at the `GET /api/report` endpoint.

---

### React Frontend Components (`frontend/src/`)

---

#### [`App.jsx`](file:///d:/sem3/excel/numpy/Uday_major_project/frontend/src/App.jsx)

**Internal Logic:**
The root React component and global state manager. It tracks the three-step onboarding flow: `'upload'` → `'columns'` → `'ready'`. Once a model is trained, it manages tab navigation between Dashboard, XAI Explorer, and Report.

**Key State Variables:**
```
chatProvider     → "OpenRouter" (default)
chatModel        → "deepseek/deepseek-v3:free" (default)
chatApiKey       → "" (entered by user in chat settings)
predictData      → { featureName: value, ... }  (patient input values)
result           → { prediction, confidence, shap_impact, shap_summary }
metrics          → { accuracy } or { r2, mae, rmse }
taskType         → "classification" or "regression"
```

**Key Behaviors:**
- `useDebounce(predictData, 500ms)` → prevents excessive `/api/predict` calls while user is dragging sliders
- Backend health check every 8 seconds via `GET /api/health` → updates `backendOnline` to show/hide connection warning banner
- Auto-loads a sample patient via `GET /api/sample` immediately after model training

---

#### [`EDADashboard.jsx`](file:///d:/sem3/excel/numpy/Uday_major_project/frontend/src/components/EDADashboard.jsx)

**Internal Logic:**
A collapsible card in the Dashboard tab that automatically fetches EDA visualizations from the backend after model training completes. It calls `GET /api/eda` once using a `useEffect` triggered by the `isModelReady` prop. The backend returns a JSON object with three Base64-encoded PNG strings: `plot_dist1`, `plot_dist2`, and `plot_corr`. These are rendered directly into `<img>` tags without any external chart library.

**Visualization Content:**
1. **Distribution Plot 1** — Histogram of the first continuous feature (e.g., Glucose), grouped by target class with colored overlay
2. **Distribution Plot 2** — Histogram of the second continuous feature (e.g., BMI), similarly grouped
3. **Correlation Heatmap** — Pearson correlation matrix of up to 9 numeric features using Matplotlib `imshow` with `coolwarm` colormap and value annotations

**Integration:** Rendered inside the `'dashboard'` case in `App.jsx`, below the PatientForm + ResultPanel grid. Receives `isModelReady={!!metrics}` as prop.

---

#### [`ChatDrawer.jsx`](file:///d:/sem3/excel/numpy/Uday_major_project/frontend/src/components/ChatDrawer.jsx)

**Internal Logic:**
A slide-out drawer panel anchored to the bottom right corner of the app. It contains a settings panel (triggered by the gear icon ⚙️) where users select their LLM Provider and Model, and paste API keys. Settings are staged locally and only applied to parent state on "Apply Settings" click.

**Provider Configuration in UI:**

| Provider | Requires Key | Agent-Capable Models (tool-calling) |
|:---|:---:|:---|
| **OpenRouter** | ✅ | OpenRouter Free, DeepSeek V3, Hermes 3 405B, GPT-OSS 120B, Llama 3.3 70B, and more |
| **NVIDIA NIM** | ✅ | Llama 3.1 405B/70B, Mixtral 8x22B, Mistral Large, Qwen 3 Next, GLM 5.1/4, MiniMax M3 |

Models tagged `agent: true` support tool-calling (email). Models tagged `agent: false` are text-only.

---

#### [`ReportPanel.jsx`](file:///d:/sem3/excel/numpy/Uday_major_project/frontend/src/components/ReportPanel.jsx)

**Internal Logic:**
The Report tab content. Renders four cards: Diagnosis/Prediction Summary, Patient Feature Profile Radar Chart (comparing patient vs. dataset mean using `featureStats`), Patient Input Values table, and SHAP Feature Impact table. Includes a full-width "AI Clinical Summary & Recommendations" card.

**AI Clinical Summary Workflow:**
1. User clicks **"Generate AI Insights"**
2. A detailed prompt is built containing prediction outcome, confidence, patient values, and SHAP summary
3. The prompt includes explicit formatting instructions: use `\n\n` between paragraphs, use `**bold headers**`, maintain absolute spelling accuracy
4. Posted to `POST /api/chat` using the active `chatProvider`/`chatModel`/`chatApiKey`
5. The response string is rendered through the [`Typewriter`](file:///d:/sem3/excel/numpy/Uday_major_project/frontend/src/components/Typewriter.jsx) component for animated character-by-character display
6. Markdown bold (`**text**`) is converted to HTML `<b>` tags in real-time

**PDF Export:** Uses `html2pdf.js` to convert the `#analysis-report` DOM element to a downloadable PDF.

---

#### [`Typewriter.jsx`](file:///d:/sem3/excel/numpy/Uday_major_project/frontend/src/components/Typewriter.jsx)

**Internal Logic:**
A correction to a common React typing animation bug. The old `setInterval` approach caused letter-skipping (e.g., `"Te summary"` instead of `"The summary"`) due to asynchronous state batching. This component uses a state-driven `index` integer combined with `setTimeout`. Each tick reads the *current* index from React state, appends one character, then schedules the next tick — guaranteeing perfect sequential rendering under any system load.

**Usage:**
```jsx
<Typewriter text={aiInsights} speed={5} />   // 5ms per character
<Typewriter text={m.content} speed={8} />    // 8ms per character (chat messages)
```

**Markdown Support:** Converts `**text**` patterns to `<b style="color: var(--text-white); font-weight: 600;">text</b>` via `dangerouslySetInnerHTML`.

---

#### [`XAIExplorer.jsx`](file:///d:/sem3/excel/numpy/Uday_major_project/frontend/src/components/XAIExplorer.jsx)

**Internal Logic:**
Fetches global SHAP importance data from `GET /api/xai-global` on load, displaying horizontal bar charts using Recharts. Bars are colored based on `direction`: red for `risk_increase` / `value_increase`, green for `risk_decrease` / `value_decrease`. Also displays the per-patient SHAP values from the last prediction result.

---

#### [`ResultPanel.jsx`](file:///d:/sem3/excel/numpy/Uday_major_project/frontend/src/components/ResultPanel.jsx)

**Internal Logic:**
Adapts to task type. For **Classification**: displays an animated SVG circle with confidence % inside it (color changes green → amber → red based on confidence level). For **Regression**: shows the numeric predicted value at 4 decimal places, plus R², MAE, and RMSE metric cards.

---

#### [`Background.jsx`](file:///d:/sem3/excel/numpy/Uday_major_project/frontend/src/components/Background.jsx)

**Internal Logic:**
An 8-layer visual system using `framer-motion`. Each layer is independently removable (documented with `{/* ── Layer N: ... ── */}` comments). Layers include: deep space gradient, nebula orbs, 120 distant star dots, 5 shooting star streaks, an alien sun with corona animation, and 40 sparkle SVG particles. A spring-physics mouse tracker creates a subtle parallax glow effect.

---

### Standalone R Academic Component

---

#### [`academic_pipeline.R`](file:///d:/sem3/excel/numpy/Uday_major_project/Rogramming%20for%20eda%20and%20data%20cleaning/academic_pipeline.R)

**Internal Logic:**
A completely self-contained 128-line R script requiring only `dplyr` and `stats` (both standard packages). Designed intentionally without external visualization libraries to remain simple for academic examination. It runs in three sequential phases:

**Phase 1 — Data Cleaning:**
- Reads `diabetes.csv` with a fallback path check (`../diabetes.csv` or `diabetes.csv`)
- Drops NA rows via `drop_na()`
- Removes statistical outliers using IQR method: `lower = Q1 - 1.5*IQR`, `upper = Q3 + 1.5*IQR`
- Writes `cleaned_data.csv` to parent directory

**Phase 2 — Descriptive Statistics:**
- Custom `calc_skewness(x)` and `calc_kurtosis(x)` functions using raw moment formulae (no external packages)
- Computes Mean, Median, Variance, Skewness, and Excess Kurtosis for all 7 continuous predictors

**Phase 3 — Hypothesis Testing:**
- **Chi-Square test** (`chisq.test`): Age grouped into Young/Middle-aged/Senior vs. binary Outcome
- **Welch's t-test** (`t.test`): Glucose ~ Outcome (Welch variant used by default in R's `t.test`)
- **One-Way ANOVA** (`aov`): BMI ~ Age_Group across the three age categories

**This script runs completely independently of the Python backend and React frontend.**

---

## Appendix: Complete API Reference

| Method | Endpoint | Request Body | Response |
|:---|:---|:---|:---|
| `GET` | `/` | — | `{"status": "MedDiagnose AI Backend is running"}` |
| `GET` | `/api/health` | — | `{"status": "ok", "backend": "online"}` |
| `POST` | `/api/columns` | `multipart/form-data` — file | `{"columns": [...], "dtypes": {...}, "rows": N, "preview": [...]}` |
| `POST` | `/api/upload` | `multipart/form-data` — target_col | `{"status": "success", "metrics": {...}, "features": [...], "task_type": "...", "feature_stats": {...}}` |
| `GET` | `/api/sample` | — | `{"sample": {"feature": value, ...}}` |
| `POST` | `/api/predict` | `application/json` — patient dict | `{"task_type": "...", "prediction": "...", "confidence": N, "shap_summary": "...", "shap_impact": [...]}` |
| `GET` | `/api/xai-global` | — | `{"features": [{"name": "...", "importance": N, "direction": "..."}], "sample_size": N}` |
| `GET` | `/api/eda` | — | `{"plots": {"plot_dist1": "base64...", "plot_dist2": "base64...", "plot_corr": "base64..."}}` |
| `GET` | `/api/report?format=md` | query param: `format` = `md` or `txt` | `{"report": "...", "format": "md"}` |
| `POST` | `/api/chat` | `{"message": "...", "provider": "...", "model": "...", "api_key": "..."}` | `{"response": "..."}` |

---

## 🎨 Static Asset Management & Optimization

### Chatbot Assistant Avatar (`nurse_usagi.png`)
To ensure compatibility with Hugging Face Spaces' binary file push rules (which block direct `.png` commits to prevent version history bloating), the chatbot avatar image has been migrated out of local storage and is hosted on a free public image CDN:
- **Hosted Link**: [https://ibb.co/4Zz4k63B](https://ibb.co/4Zz4k63B)
- **Direct CDN URL**: `https://i.ibb.co/xSWzZpdV/nurse-usagi.jpg`
- **Configuration**: Excluded locally in `.gitignore` to avoid Git push blocks, and referenced directly in [ChatDrawer.jsx](file:///d:/sem3/excel/numpy/Uday_major_project/frontend/src/components/ChatDrawer.jsx) using the Direct CDN URL.

This optimization ensures that both our Vercel frontend and Hugging Face backend remain ultra-lightweight and compile in seconds.

