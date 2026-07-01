from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import io
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file if running locally
load_dotenv()

from chatbot_agent import get_llm, get_agent_executor, HumanMessage, AIMessage

from ml_pipeline import train_model
from xai_explainer import generate_shap_values, get_top_features_summary

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when allow_origins=["*"] — Starlette requirement
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage
state = {
    'pipeline': None,
    'le': None,
    'X_train': None,
    'feature_cols': [],
    'target_col': '',
    'metrics': {},
    'task_type': 'classification',  # 'classification' or 'regression'
    'chat_history': [],
    'df': None,
    'last_result': None,
    'last_input': None,
    'feature_stats': {},
}

class ChatRequest(BaseModel):
    message: str
    provider: str
    model: str
    api_key: str

@app.get("/")
def read_root():
    return {"status": "MedDiagnose AI Backend is running"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "backend": "online"}


def validate_dataset(df: pd.DataFrame):
    """Ensure the dataset is clean: no missing values, duplicates, or empty unnamed columns."""
    # Check for empty unnamed columns
    unnamed_cols = [col for col in df.columns if col.startswith('Unnamed:')]
    if unnamed_cols:
        raise ValueError(
            f"Dataset contains unnamed/empty columns (e.g., {', '.join(unnamed_cols)}). "
            "Please clean the dataset (remove trailing commas/empty columns) before uploading."
        )

    # Check for missing values (NaNs)
    if df.isnull().any().any():
        missing_cols = df.columns[df.isnull().any()].tolist()
        raise ValueError(
            f"Dataset contains missing values (NaNs) in columns: {', '.join(missing_cols)}. "
            "Only clean datasets without missing values are accepted. Please preprocess your data first."
        )
        
    # Automatically remove duplicate rows
    if df.duplicated().any():
        df.drop_duplicates(inplace=True)

# ─── COLUMNS (parse CSV, return column list without training) ───
@app.post("/api/columns")
async def get_columns(file: UploadFile = File(...)):
    """Upload CSV and return just the column names for target selection."""
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        # Validate dataset cleanliness
        validate_dataset(df)
            
        state['df'] = df
        columns = df.columns.tolist()
        dtypes = {col: str(df[col].dtype) for col in columns}
        
        # Safe to convert directly to dict since NaNs are rejected
        preview = df.head(3).to_dict(orient='records')
        
        return {
            "columns": columns,
            "dtypes": dtypes,
            "rows": len(df),
            "preview": preview
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── UPLOAD & TRAIN (auto-detects classification vs regression) ───
@app.post("/api/upload")
async def upload_dataset(
    file: UploadFile = File(None),
    target_col: str = Form("Outcome")
):
    try:
        if file and file.filename:
            content = await file.read()
            df = pd.read_csv(io.BytesIO(content))
            validate_dataset(df)
            state['df'] = df
        elif state['df'] is not None:
            df = state['df']
        else:
            raise HTTPException(status_code=400, detail="No dataset available. Upload a file first.")

        if target_col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Target column '{target_col}' not found in dataset.")

        feature_cols = [c for c in df.columns if c != target_col]

        # train_model now returns 5 values including task_type
        pipeline, le, metrics, X_train, task_type = train_model(df, target_col, feature_cols)

        state['pipeline'] = pipeline
        state['le'] = le
        state['X_train'] = X_train
        state['feature_cols'] = feature_cols
        state['target_col'] = target_col
        state['metrics'] = metrics
        state['task_type'] = task_type
        state['last_result'] = None
        state['last_input'] = None

        # Compute feature statistics (min, max, mean) for all numeric features
        feature_stats = {}
        for col in feature_cols:
            if pd.api.types.is_numeric_dtype(df[col]):
                feature_stats[col] = {
                    "min": float(df[col].min()),
                    "max": float(df[col].max()),
                    "mean": float(df[col].mean()),
                }
        state['feature_stats'] = feature_stats

        return {
            "status": "success",
            "metrics": state['metrics'],
            "features": feature_cols,
            "target": target_col,
            "task_type": task_type,
            "feature_stats": feature_stats
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── SAMPLE DATA ───
@app.get("/api/sample")
async def get_sample():
    """Return a sample data row from training data for preloaded inputs."""
    if not state['feature_cols'] or state['X_train'] is None:
        raise HTTPException(status_code=400, detail="No model trained yet.")

    idx = int(np.random.randint(0, len(state['X_train'])))
    row = state['X_train'].iloc[idx]
    sample = {}
    for col in state['feature_cols']:
        if col in row.index:
            val = row[col]
            if isinstance(val, (np.integer, int)):
                sample[col] = int(val)
            elif isinstance(val, (np.floating, float)):
                sample[col] = round(float(val), 2)
            else:
                sample[col] = str(val)
        else:
            sample[col] = 0.0
    return {"sample": sample}


@app.post("/api/load-sample")
async def load_sample_dataset():
    """Load default dataset, map columns, auto-train XGBoost pipeline, and return preview + sample."""
    try:
        # Load diabetes.csv
        filepath = "diabetes.csv"
        if not os.path.exists(filepath):
            raise HTTPException(status_code=400, detail="Default diabetes.csv dataset not found.")
        df = pd.read_csv(filepath)
        validate_dataset(df)
        state['df'] = df

        target_col = "Outcome"
        if target_col not in df.columns:
            target_col = df.columns[-1]

        feature_cols = [c for c in df.columns if c != target_col]

        # Train model
        pipeline, le, metrics, X_train, task_type = train_model(df, target_col, feature_cols)

        state['pipeline'] = pipeline
        state['le'] = le
        state['X_train'] = X_train
        state['feature_cols'] = feature_cols
        state['target_col'] = target_col
        state['metrics'] = metrics
        state['task_type'] = task_type
        state['last_result'] = None
        state['last_input'] = None

        feature_stats = {}
        for col in feature_cols:
            if pd.api.types.is_numeric_dtype(df[col]):
                feature_stats[col] = {
                    "min": float(df[col].min()),
                    "max": float(df[col].max()),
                    "mean": float(df[col].mean()),
                }
        state['feature_stats'] = feature_stats

        # Return sample data row
        idx = int(np.random.randint(0, len(X_train)))
        row = X_train.iloc[idx]
        sample = {}
        for col in feature_cols:
            if col in row.index:
                val = row[col]
                if isinstance(val, (np.integer, int)):
                    sample[col] = int(val)
                elif isinstance(val, (np.floating, float)):
                    sample[col] = round(float(val), 2)
                else:
                    sample[col] = str(val)
            else:
                sample[col] = 0.0

        # Retrieve first 15 rows for frontend batch state
        preview_batch = df.head(15).to_dict(orient='records')

        return {
            "status": "success",
            "metrics": metrics,
            "features": feature_cols,
            "target": target_col,
            "task_type": task_type,
            "feature_stats": feature_stats,
            "sample": sample,
            "batch_data": preview_batch
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predict-batch")
async def predict_batch(records: list):
    """Predict outcomes for an array/batch of patient records."""
    if not state['pipeline']:
        raise HTTPException(status_code=400, detail="Model not trained yet. Load or upload a dataset first.")
    try:
        input_df = pd.DataFrame(records)
        task_type = state['task_type']
        preds = state['pipeline'].predict(input_df)

        results = []
        if task_type == 'classification':
            decoded_preds = state['le'].inverse_transform(preds)
            try:
                probs = state['pipeline'].predict_proba(input_df)
                confidences = [float(max(p) * 100) for p in probs]
            except Exception:
                confidences = [100.0] * len(preds)

            for dp, conf, orig in zip(decoded_preds, confidences, records):
                results.append({
                    "prediction": str(dp),
                    "confidence": conf,
                    "record": orig
                })
        else:
            # Regression
            for p, orig in zip(preds, records):
                results.append({
                    "prediction": round(float(p), 4),
                    "record": orig
                })

        return {"predictions": results, "task_type": task_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── PREDICT (handles both classification and regression) ───
@app.post("/api/predict")
async def predict(data: dict):
    if not state['pipeline']:
        raise HTTPException(status_code=400, detail="Model not trained yet. Upload a dataset first.")

    try:
        input_df = pd.DataFrame([data])
        task_type = state['task_type']

        # SHAP (works for both task types)
        explainer, shap_exp, X_trans, f_names = generate_shap_values(
            state['pipeline'], input_df, state['X_train']
        )
        shap_summary = get_top_features_summary(shap_exp, f_names, task_type=task_type)

        # SHAP impact data
        vals = shap_exp.values[0]
        if len(vals.shape) > 1:
            # Multiclass: pick the predicted class
            raw_pred = state['pipeline'].predict(input_df)
            vals = vals[:, int(raw_pred[0])]

        feats_impact = [{"name": str(n), "value": float(v)} for n, v in zip(f_names, vals)]

        if task_type == 'classification':
            raw_pred = state['pipeline'].predict(input_df)
            decoded_pred = str(state['le'].inverse_transform(raw_pred)[0])

            prob = state['pipeline'].predict_proba(input_df)[0]
            confidence = float(max(prob) * 100)

            report_ctx = f"Patient Prediction: {decoded_pred}\nConfidence: {confidence:.2f}%\n\nKey Feature Contributions:\n{shap_summary}"
            state['chat_history'] = [HumanMessage(content=f"Here is a new patient report:\n{report_ctx}\nPlease summarize it for the doctor briefly.")]

            result = {
                "task_type": "classification",
                "prediction": str(decoded_pred),
                "confidence": float(confidence),
                "shap_summary": str(shap_summary),
                "shap_impact": feats_impact
            }

        else:
            # Regression
            raw_pred = state['pipeline'].predict(input_df)
            predicted_value = float(raw_pred[0])

            report_ctx = (
                f"Predicted {state['target_col']}: {predicted_value:.4f}\n"
                f"Model R²: {state['metrics'].get('r2', 0):.4f}\n"
                f"Model MAE: {state['metrics'].get('mae', 0):.4f}\n\n"
                f"Key Feature Contributions:\n{shap_summary}"
            )
            state['chat_history'] = [HumanMessage(content=f"Here is a new patient report:\n{report_ctx}\nPlease summarize it for the doctor briefly.")]

            result = {
                "task_type": "regression",
                "prediction": round(predicted_value, 4),
                "predicted_value": round(predicted_value, 4),
                "r2": float(state['metrics'].get('r2', 0)),
                "mae": float(state['metrics'].get('mae', 0)),
                "rmse": float(state['metrics'].get('rmse', 0)),
                "shap_summary": str(shap_summary),
                "shap_impact": feats_impact
            }

        # Store for report
        state['last_result'] = result
        state['last_input'] = {
            str(k): float(v) if isinstance(v, (int, float, np.integer, np.floating)) else str(v)
            for k, v in data.items()
        }

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── REPORT GENERATION ───
@app.get("/api/report")
async def get_report(format: str = "md"):
    """Generate a downloadable report. Adapts for classification vs regression."""
    if not state['last_result']:
        raise HTTPException(status_code=400, detail="No prediction available. Run a prediction first.")

    result = state['last_result']
    patient_input = state['last_input'] or {}
    target = state['target_col']
    task_type = state['task_type']

    lines = []
    if format == "md":
        lines.append("# MedDiagnose AI — Patient Diagnostic Report")
        lines.append("")
        lines.append(f"**Target Variable:** {target}")
        lines.append(f"**Analysis Type:** {'Classification' if task_type == 'classification' else 'Regression'}")
        lines.append(f"**Prediction:** {result['prediction']}")

        if task_type == 'classification':
            lines.append(f"**Confidence:** {result.get('confidence', 0):.1f}%")
            lines.append(f"**Model Accuracy:** {state['metrics'].get('accuracy', 0) * 100:.1f}%")
        else:
            lines.append(f"**Predicted Value:** {result.get('predicted_value', 0):.4f}")
            lines.append(f"**Model R² Score:** {state['metrics'].get('r2', 0):.4f}")
            lines.append(f"**Model MAE:** {state['metrics'].get('mae', 0):.4f}")
            lines.append(f"**Model RMSE:** {state['metrics'].get('rmse', 0):.4f}")

        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("## Patient Input Values")
        lines.append("")
        lines.append("| Feature | Value |")
        lines.append("|---------|-------|")
        for k, v in patient_input.items():
            lines.append(f"| {k} | {v} |")
        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("## SHAP Feature Impact Analysis")
        lines.append("")
        if task_type == 'classification':
            lines.append("| Feature | SHAP Value | Direction |")
            lines.append("|---------|------------|-----------|")
            for feat in sorted(result['shap_impact'], key=lambda x: abs(x['value']), reverse=True):
                direction = "↑ Increases Risk" if feat['value'] > 0 else "↓ Decreases Risk"
                lines.append(f"| {feat['name']} | {feat['value']:.4f} | {direction} |")
        else:
            lines.append("| Feature | SHAP Value | Effect |")
            lines.append("|---------|------------|--------|")
            for feat in sorted(result['shap_impact'], key=lambda x: abs(x['value']), reverse=True):
                effect = "↑ Increases Value" if feat['value'] > 0 else "↓ Decreases Value"
                lines.append(f"| {feat['name']} | {feat['value']:.4f} | {effect} |")

        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("## Top Contributing Factors")
        lines.append("")
        lines.append(result['shap_summary'])
        lines.append("")
        lines.append("---")
        lines.append("")
        lines.append("*⚠️ This report is generated by an AI system and should not be used as a substitute for professional medical advice.*")
    else:
        # Plain text
        lines.append("=" * 60)
        lines.append("  MedDiagnose AI — Patient Diagnostic Report")
        lines.append("=" * 60)
        lines.append("")
        lines.append(f"  Target Variable:  {target}")
        lines.append(f"  Analysis Type:    {'Classification' if task_type == 'classification' else 'Regression'}")
        lines.append(f"  Prediction:       {result['prediction']}")

        if task_type == 'classification':
            lines.append(f"  Confidence:       {result.get('confidence', 0):.1f}%")
            lines.append(f"  Model Accuracy:   {state['metrics'].get('accuracy', 0) * 100:.1f}%")
        else:
            lines.append(f"  Predicted Value:  {result.get('predicted_value', 0):.4f}")
            lines.append(f"  Model R² Score:   {state['metrics'].get('r2', 0):.4f}")
            lines.append(f"  Model MAE:        {state['metrics'].get('mae', 0):.4f}")
            lines.append(f"  Model RMSE:       {state['metrics'].get('rmse', 0):.4f}")

        lines.append("")
        lines.append("-" * 60)
        lines.append("  PATIENT INPUT VALUES")
        lines.append("-" * 60)
        for k, v in patient_input.items():
            lines.append(f"  {k:.<30} {v}")
        lines.append("")
        lines.append("-" * 60)
        lines.append("  SHAP FEATURE IMPACT ANALYSIS")
        lines.append("-" * 60)
        label = "RISK" if task_type == 'classification' else "VALUE"
        for feat in sorted(result['shap_impact'], key=lambda x: abs(x['value']), reverse=True):
            direction = f"INCREASES {label}" if feat['value'] > 0 else f"DECREASES {label}"
            lines.append(f"  {feat['name']:.<25} {feat['value']:>8.4f}  ({direction})")
        lines.append("")
        lines.append("=" * 60)
        lines.append("  WARNING: This report is AI-generated. Consult a doctor.")
        lines.append("=" * 60)

    return {"report": "\n".join(lines), "format": format}

# ─── XAI GLOBAL ───
@app.get("/api/xai-global")
async def xai_global():
    """Compute global feature importance — works for both classification and regression."""
    if not state['pipeline'] or state['X_train'] is None:
        raise HTTPException(status_code=400, detail="No model trained yet.")

    try:
        sample_size = min(100, len(state['X_train']))
        sample = state['X_train'].sample(sample_size, random_state=42)

        explainer, shap_exp, X_trans, f_names = generate_shap_values(
            state['pipeline'], sample, state['X_train']
        )

        vals = shap_exp.values
        if len(vals.shape) == 3:  # multiclass
            vals = vals[:, :, 0]

        mean_abs = np.mean(np.abs(vals), axis=0)
        mean_signed = np.mean(vals, axis=0)

        task_type = state['task_type']
        importance = []
        for i, name in enumerate(f_names):
            if task_type == 'classification':
                direction = "risk_increase" if float(mean_signed[i]) > 0 else "risk_decrease"
            else:
                direction = "value_increase" if float(mean_signed[i]) > 0 else "value_decrease"

            importance.append({
                "name": str(name),
                "importance": float(mean_abs[i]),
                "direction": direction,
                "mean_value": float(mean_signed[i])
            })

        importance.sort(key=lambda x: x['importance'], reverse=True)

        return {
            "features": importance,
            "sample_size": sample_size,
            "target": state['target_col'],
            "task_type": task_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── EDA & STATISTICAL REPORTS ───
@app.get("/api/eda")
async def get_eda():
    import io
    import base64
    import matplotlib
    matplotlib.use('Agg')  # Use non-interactive backend
    import matplotlib.pyplot as plt
    import scipy.stats as stats

    df = state.get('df')
    if df is None:
        # Fallback to loading diabetes.csv if no dataset uploaded yet
        try:
            df = pd.read_csv("diabetes.csv")
            state['df'] = df
            state['target_col'] = "Outcome"
            state['feature_cols'] = [c for c in df.columns if c != "Outcome"]
        except Exception as err:
            raise HTTPException(status_code=400, detail=f"No dataset available: {str(err)}")

    target_col = state.get('target_col', 'Outcome')
    feature_cols = state.get('feature_cols', [])
    
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    continuous_features = [col for col in numeric_cols if col != target_col]
    
    # 3. Generate Visualizations (Matplotlib)
    dist_cols = [c for c in ['Glucose', 'BMI'] if c in df.columns]
    if len(dist_cols) < 2:
        dist_cols = continuous_features[:2]
        
    plots = {}
    
    # Distribution Plot 1
    if len(dist_cols) > 0:
        try:
            col1 = dist_cols[0]
            fig, ax = plt.subplots(figsize=(6, 4))
            fig.patch.set_facecolor('#0b0f19')
            ax.set_facecolor('#0f172a')
            
            # Group by target variable
            if target_col in df.columns and df[target_col].nunique() <= 5:
                unique_vals = sorted(df[target_col].unique())
                colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1"]
                for idx, val in enumerate(unique_vals):
                    subset = df[df[target_col] == val][col1].dropna()
                    ax.hist(subset, bins=15, alpha=0.4, density=True, 
                            label=f"{target_col}: {val}", color=colors[idx % len(colors)])
                ax.legend(facecolor='#1e293b', edgecolor='#334155', labelcolor='#f8fafc', fontsize=9)
            else:
                ax.hist(df[col1].dropna(), bins=20, alpha=0.5, density=True, color="#3b82f6")
                
            ax.set_title(f"{col1} Distribution Plot", fontsize=12, fontweight='bold', color='#f8fafc')
            ax.set_xlabel(col1, color='#94a3b8')
            ax.set_ylabel("Density", color='#94a3b8')
            ax.tick_params(colors='#94a3b8')
            ax.grid(True, color='#334155', alpha=0.3)
            for spine in ax.spines.values():
                spine.set_color('#334155')
                
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=120, bbox_inches='tight')
            buf.seek(0)
            plots["plot_dist1"] = base64.b64encode(buf.read()).decode('utf-8')
            plt.close(fig)
        except Exception as e:
            plots["plot_dist1_error"] = str(e)
            
    # Distribution Plot 2
    if len(dist_cols) > 1:
        try:
            col2 = dist_cols[1]
            fig, ax = plt.subplots(figsize=(6, 4))
            fig.patch.set_facecolor('#0b0f19')
            ax.set_facecolor('#0f172a')
            
            if target_col in df.columns and df[target_col].nunique() <= 5:
                unique_vals = sorted(df[target_col].unique())
                colors = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#6366f1"]
                for idx, val in enumerate(unique_vals):
                    subset = df[df[target_col] == val][col2].dropna()
                    ax.hist(subset, bins=15, alpha=0.4, density=True, 
                            label=f"{target_col}: {val}", color=colors[idx % len(colors)])
                ax.legend(facecolor='#1e293b', edgecolor='#334155', labelcolor='#f8fafc', fontsize=9)
            else:
                ax.hist(df[col2].dropna(), bins=20, alpha=0.5, density=True, color="#10b981")
                
            ax.set_title(f"{col2} Distribution Plot", fontsize=12, fontweight='bold', color='#f8fafc')
            ax.set_xlabel(col2, color='#94a3b8')
            ax.set_ylabel("Density", color='#94a3b8')
            ax.tick_params(colors='#94a3b8')
            ax.grid(True, color='#334155', alpha=0.3)
            for spine in ax.spines.values():
                spine.set_color('#334155')
                
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=120, bbox_inches='tight')
            buf.seek(0)
            plots["plot_dist2"] = base64.b64encode(buf.read()).decode('utf-8')
            plt.close(fig)
        except Exception as e:
            plots["plot_dist2_error"] = str(e)

    # Correlation Matrix Heatmap (using matplotlib imshow)
    if len(continuous_features) > 1:
        try:
            selected_features = [target_col] + continuous_features[:8] if target_col in df.columns else continuous_features[:8]
            selected_features = list(dict.fromkeys(selected_features))
            sub_df = df[selected_features].select_dtypes(include=[np.number])
            
            fig, ax = plt.subplots(figsize=(7.5, 6))
            fig.patch.set_facecolor('#0b0f19')
            ax.set_facecolor('#0f172a')
            
            corr = sub_df.corr().values
            cols = sub_df.corr().columns.tolist()
            
            im = ax.imshow(corr, cmap="coolwarm", vmin=-1, vmax=1)
            
            # Add colorbar
            cbar = fig.colorbar(im, ax=ax)
            cbar.ax.yaxis.set_tick_params(color='#94a3b8')
            cbar.ax.tick_params(labelcolor='#94a3b8')
            
            # Show annotations
            for i in range(len(cols)):
                for j in range(len(cols)):
                    ax.text(j, i, f"{corr[i, j]:.2f}",
                            ha="center", va="center", color="white" if abs(corr[i, j]) > 0.4 else "black", 
                            fontsize=9, fontweight="bold")
                            
            ax.set_xticks(np.arange(len(cols)))
            ax.set_yticks(np.arange(len(cols)))
            ax.set_xticklabels(cols, rotation=45, ha="right", color='#94a3b8')
            ax.set_yticklabels(cols, color='#94a3b8')
            ax.set_title("Feature Correlation Matrix Heatmap", fontsize=12, fontweight='bold', color='#f8fafc')
            
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=120, bbox_inches='tight')
            buf.seek(0)
            plots["plot_corr"] = base64.b64encode(buf.read()).decode('utf-8')
            plt.close(fig)
        except Exception as e:
            plots["plot_corr_error"] = str(e)

    # 4. Generate Confusion Matrix (Matplotlib) with Safe Alignment, Sentiment Inference & Fallback
    if state.get('pipeline') is not None and state.get('task_type') == 'classification':
        try:
            from sklearn.metrics import confusion_matrix as sk_confusion_matrix
            y_true_raw = df[target_col].copy()
            X_feats = df[feature_cols]
            y_pred_encoded = state['pipeline'].predict(X_feats)
            y_pred_raw = state['le'].inverse_transform(y_pred_encoded)

            # Load into DataFrame to align numeric columns and protect indices from sliding out of sync
            align_df = pd.DataFrame({
                'true': y_true_raw,
                'pred': y_pred_raw
            })

            # Check for explicit sentiment column case-insensitively, fallback to ratings/stars
            sentiment_col_name = None
            for col in df.columns:
                if col.lower() in ['sentiment', 'polarity', 'sentiment_label', 'true_sentiment', 'label', 'feedback_sentiment']:
                    sentiment_col_name = col
                    break

            if sentiment_col_name is None:
                for col in df.columns:
                    if col.lower() in ['rating', 'stars', 'score', 'star_rating', 'user_rating']:
                        sentiment_col_name = col
                        break

            # Robust case-insensitive mapper converting stars and polarities
            def map_sentiment(val):
                if pd.isna(val):
                    return None
                val_str = str(val).strip().lower()
                try:
                    num_val = float(val)
                    if num_val >= 4.0:
                        return 'positive'
                    elif num_val <= 2.0:
                        return 'negative'
                    elif num_val == 1.0:
                        return 'positive'
                    elif num_val == 0.0:
                        return 'negative'
                    return None
                except ValueError:
                    pass

                if val_str in ['positive', 'pos', 'yes', '1', 'diabetic', 'malignant', 'true', '1.0']:
                    return 'positive'
                elif val_str in ['negative', 'neg', 'no', '0', 'normal', 'benign', 'false', '0.0']:
                    return 'negative'
                return None

            # If an explicit sentiment or rating column was found, use it; otherwise map target values directly
            if sentiment_col_name is not None and sentiment_col_name in df.columns:
                align_df['true_mapped'] = df[sentiment_col_name].apply(map_sentiment)
            else:
                align_df['true_mapped'] = align_df['true'].apply(map_sentiment)

            align_df['pred_mapped'] = align_df['pred'].apply(map_sentiment)
            align_df = align_df.dropna(subset=['true_mapped', 'pred_mapped'])

            # Verify if we have valid labels to plot
            unique_trues = align_df['true_mapped'].unique()
            if len(align_df) < 5 or len(unique_trues) < 2:
                # Graceful fallback: Plot distribution of model predictions
                fig, ax = plt.subplots(figsize=(6, 4))
                fig.patch.set_facecolor('#0b0f19')
                ax.set_facecolor('#0f172a')

                pred_counts = pd.Series(y_pred_raw).value_counts()
                colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1"]
                ax.bar(pred_counts.index.astype(str), pred_counts.values, color=colors[:len(pred_counts)])
                ax.set_title("Model Predictions Distribution (Fallback)", fontsize=12, fontweight='bold', color='#f8fafc')
                ax.set_xlabel("Predicted Class", color='#94a3b8')
                ax.set_ylabel("Count", color='#94a3b8')
                ax.tick_params(colors='#94a3b8')
                ax.grid(True, color='#334155', alpha=0.3)
                for spine in ax.spines.values():
                    spine.set_color('#334155')

                buf = io.BytesIO()
                plt.savefig(buf, format='png', dpi=120, bbox_inches='tight')
                buf.seek(0)
                plots["plot_confusion"] = base64.b64encode(buf.read()).decode('utf-8')
                plt.close(fig)
            else:
                # Plot Confusion Matrix
                classes = ['negative', 'positive']
                cm = sk_confusion_matrix(align_df['true_mapped'], align_df['pred_mapped'], labels=classes)

                fig, ax = plt.subplots(figsize=(6, 5))
                fig.patch.set_facecolor('#0b0f19')
                ax.set_facecolor('#0f172a')

                im = ax.imshow(cm, cmap="Blues", interpolation='nearest')
                fig.colorbar(im, ax=ax).ax.tick_params(labelcolor='#94a3b8')

                for i in range(len(classes)):
                    for j in range(len(classes)):
                        ax.text(j, i, str(cm[i, j]),
                                ha="center", va="center",
                                color="white" if cm[i, j] > (cm.max() / 2) else "black",
                                fontsize=12, fontweight="bold")

                ax.set_xticks(np.arange(len(classes)))
                ax.set_yticks(np.arange(len(classes)))
                ax.set_xticklabels(classes, color='#94a3b8')
                ax.set_yticklabels(classes, color='#94a3b8')
                ax.set_xlabel('Predicted Sentiment / Outcome', color='#94a3b8', fontweight='bold')
                ax.set_ylabel('True Sentiment / Outcome', color='#94a3b8', fontweight='bold')
                ax.set_title("Model Confusion Matrix Heatmap", fontsize=12, fontweight='bold', color='#f8fafc')

                buf = io.BytesIO()
                plt.savefig(buf, format='png', dpi=120, bbox_inches='tight')
                buf.seek(0)
                plots["plot_confusion"] = base64.b64encode(buf.read()).decode('utf-8')
                plt.close(fig)
        except Exception as e:
            plots["plot_confusion_error"] = str(e)

    # 5. Target Class Balance Plot
    if target_col in df.columns:
        try:
            fig, ax = plt.subplots(figsize=(6, 4))
            fig.patch.set_facecolor('#0b0f19')
            ax.set_facecolor('#0f172a')
            
            counts = df[target_col].value_counts()
            colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1"]
            ax.bar(counts.index.astype(str), counts.values, color=colors[:len(counts)], alpha=0.8, width=0.4)
            
            ax.set_title(f"Target Class Balance ({target_col})", fontsize=12, fontweight='bold', color='#f8fafc')
            ax.set_xlabel("Outcome Class", color='#94a3b8')
            ax.set_ylabel("Patient Count", color='#94a3b8')
            ax.tick_params(colors='#94a3b8')
            ax.grid(True, color='#334155', alpha=0.3)
            for spine in ax.spines.values():
                spine.set_color('#334155')
                
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=120, bbox_inches='tight')
            buf.seek(0)
            plots["plot_class_balance"] = base64.b64encode(buf.read()).decode('utf-8')
            plt.close(fig)
        except Exception as e:
            plots["plot_class_balance_error"] = str(e)

    # 6. Feature Boxplot Plot (grouped by target)
    if len(dist_cols) > 0 and target_col in df.columns:
        try:
            col1 = dist_cols[0]
            fig, ax = plt.subplots(figsize=(6, 4))
            fig.patch.set_facecolor('#0b0f19')
            ax.set_facecolor('#0f172a')
            
            unique_vals = sorted(df[target_col].unique())
            data_groups = [df[df[target_col] == val][col1].dropna().values for val in unique_vals]
            
            bp = ax.boxplot(data_groups, labels=[str(v) for v in unique_vals], patch_artist=True)
            
            colors = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#6366f1"]
            for patch, color in zip(bp['boxes'], colors):
                patch.set_facecolor(color)
                patch.set_alpha(0.6)
                patch.set_edgecolor('#94a3b8')
            
            for element in ['whiskers', 'caps', 'medians']:
                plt.setp(bp[element], color='#94a3b8')
            plt.setp(bp['fliers'], markeredgecolor='#ef4444', markerfacecolor='#ef4444')
            
            ax.set_title(f"{col1} Distribution Grouped by {target_col}", fontsize=12, fontweight='bold', color='#f8fafc')
            ax.set_xlabel(target_col, color='#94a3b8')
            ax.set_ylabel(col1, color='#94a3b8')
            ax.tick_params(colors='#94a3b8')
            ax.grid(True, color='#334155', alpha=0.3)
            for spine in ax.spines.values():
                spine.set_color('#334155')
                
            buf = io.BytesIO()
            plt.savefig(buf, format='png', dpi=120, bbox_inches='tight')
            buf.seek(0)
            plots["plot_boxplot"] = base64.b64encode(buf.read()).decode('utf-8')
            plt.close(fig)
        except Exception as e:
            plots["plot_boxplot_error"] = str(e)

    return {
        "plots": plots,
        "dataset_name": "diabetes.csv" if state.get('df') is None else "uploaded_dataset.csv"
    }

def format_llm_exception(e: Exception) -> str:
    err_msg = str(e)
    # Check for 429 / Rate Limit
    if "429" in err_msg or "rate limit" in err_msg.lower() or "rate-limited" in err_msg.lower() or "too many requests" in err_msg.lower():
        return (
            "OpenRouter rate limit exceeded (Error 429). The selected free model is temporarily rate-limited upstream. "
            "Please wait a moment and retry, switch to another model in the settings (gear icon ⚙️), "
            "or add a personal OpenRouter API key with credits to accumulate higher rate limits."
        )
    # Check for 401 / Unauthorized
    elif "401" in err_msg or "unauthorized" in err_msg.lower() or "invalid_api_key" in err_msg.lower() or "api key" in err_msg.lower():
        return (
            "Authentication failed (Error 401). The API key provided is invalid or incorrect. "
            "Please click the settings gear icon (⚙️) and enter a valid OpenRouter API key."
        )
    # Check for 403 / Forbidden
    elif "403" in err_msg or "forbidden" in err_msg.lower():
        return (
            "Access forbidden (Error 403). Your API key does not have permission to access the selected model. "
            "Please check your API key scope or select a different model in the settings."
        )
    # Check for 404 / Model Not Found
    elif "404" in err_msg or "not found" in err_msg.lower():
        return (
            "Model not found (Error 404). The selected model is not available or its name is incorrect. "
            "Please check your settings and select a valid model."
        )
    # Check for connection issues
    elif "connection" in err_msg.lower() or "timeout" in err_msg.lower() or "failed to establish" in err_msg.lower():
        return (
            "Connection failed. Could not connect to the AI provider. "
            "Please verify your internet connection and try again."
        )
    # Fallback to extract nested message if it looks like a dict/JSON
    else:
        try:
            if "{" in err_msg and "}" in err_msg:
                start = err_msg.find("{")
                end = err_msg.rfind("}") + 1
                json_part = err_msg[start:end]
                json_part_fixed = json_part.replace("'", '"').replace("True", "true").replace("False", "false").replace("None", "null")
                data = json.loads(json_part_fixed)
                msg = data.get("error", {}).get("message")
                if not msg:
                    msg = data.get("error", {}).get("metadata", {}).get("raw")
                if msg:
                    return f"AI Provider Error: {msg}"
        except Exception:
            pass
        return f"AI Provider Error: {err_msg}"

# ─── KEYS STATUS ───
@app.get("/api/keys-status")
def get_keys_status():
    """Return whether API keys are configured on the server for each provider."""
    return {
        "Google Gemini": bool(os.environ.get("GOOGLE_API_KEY")),
        "OpenRouter": bool(os.environ.get("OPENROUTER_API_KEY")),
        "NVIDIA NIM": bool(os.environ.get("NVIDIA_API_KEY")),
        "Mistral": bool(os.environ.get("MISTRAL_API_KEY")),
        "Cerebras": bool(os.environ.get("CEREBRAS_API_KEY")),
    }

# ─── CHAT ───
@app.post("/api/chat")
async def chat(req: ChatRequest):
    # Determine the fallback key from server-side environment variables if client did not supply one
    api_key = req.api_key
    if api_key == "dummy" or not api_key or api_key.strip() == "":
        provider_env_mapping = {
            "Google Gemini": "GOOGLE_API_KEY",
            "OpenRouter": "OPENROUTER_API_KEY",
            "NVIDIA NIM": "NVIDIA_API_KEY",
            "Mistral": "MISTRAL_API_KEY",
            "Cerebras": "CEREBRAS_API_KEY"
        }
        env_var_name = provider_env_mapping.get(req.provider)
        if env_var_name:
            api_key = os.environ.get(env_var_name, "")
            
    # Validate API key for cloud providers
    if req.provider != "Ollama (Local)" and (not api_key or api_key.strip() == ""):
        raise HTTPException(
            status_code=400,
            detail=f"API key is required for {req.provider}. Please enter your API key in the chat settings (gear icon) or configure the environment variable on the server."
        )

    try:
        agent = get_agent_executor(req.provider, api_key, req.model)
        
        # Build messages list: chat_history + new user message
        messages = state['chat_history'].copy()
        messages.append(HumanMessage(content=req.message))
        
        # LangChain 1.x create_agent uses {"messages": [...]} format
        response = agent.invoke({"messages": messages})
        
        # Extract the last AI message from response
        response_messages = response.get("messages", [])
        output_text = "Empty response from agent."
        for msg in reversed(response_messages):
            if isinstance(msg, AIMessage) and msg.content:
                output_text = msg.content
                break
        
        state['chat_history'].append(HumanMessage(content=req.message))
        state['chat_history'].append(AIMessage(content=output_text))
        
        return {"response": output_text}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("=== CHAT ENDPOINT ERROR ===")
        traceback.print_exc()
        print("===========================")
        friendly_msg = format_llm_exception(e)
        raise HTTPException(status_code=400, detail=friendly_msg)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)

