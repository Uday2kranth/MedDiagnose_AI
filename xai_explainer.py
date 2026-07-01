import shap
import numpy as np

def generate_shap_values(pipeline, X_input, X_train):
    """
    Generate SHAP values for tree-based pipeline models.
    Works for both classification (classifier step) and regression (regressor step).
    """
    preprocessor = pipeline.named_steps['preprocessor']
    
    # Get the model step — either 'classifier' or 'regressor'
    if 'classifier' in pipeline.named_steps:
        model = pipeline.named_steps['classifier']
    elif 'regressor' in pipeline.named_steps:
        model = pipeline.named_steps['regressor']
    else:
        raise ValueError("Pipeline must have a 'classifier' or 'regressor' step.")
    
    # Get feature names after preprocessing
    try:
        numeric_features = preprocessor.transformers_[0][2]
        categorical_features = preprocessor.transformers_[1][2]
        if len(categorical_features) > 0:
            cat_encoder = preprocessor.named_transformers_['cat'].named_steps['onehot']
            cat_feature_names = cat_encoder.get_feature_names_out(categorical_features)
        else:
            cat_feature_names = []
            
        feature_names = list(numeric_features) + list(cat_feature_names)
    except Exception:
        # Fallback if custom pipelining fails
        n_features = preprocessor.transform(X_input).shape[1]
        feature_names = [f"Feature_{i}" for i in range(n_features)]
    
    # SHAP explainer
    explainer = shap.TreeExplainer(model)
    
    # Transform input
    X_input_transformed = preprocessor.transform(X_input)
    
    # Calculate shap values
    shap_explanation = explainer(X_input_transformed)
    
    # Update feature names for clarity
    shap_explanation.feature_names = feature_names
    
    return explainer, shap_explanation, X_input_transformed, feature_names

def get_top_features_summary(shap_explanation, feature_names, top_n=5, task_type='classification'):
    """
    Extract top features summary purely from SHAP values for AI Chatbot Context.
    Works for both classification and regression.
    """
    vals = shap_explanation.values[0]
    
    # Handle multiclass classification output format
    if len(vals.shape) > 1:
        class_idx = np.argmax(shap_explanation.base_values[0] + vals.sum(axis=0))
        vals = vals[:, class_idx]
        
    abs_vals = np.abs(vals)
    top_indices = np.argsort(abs_vals)[-top_n:][::-1]
    
    summary = []
    for idx in top_indices:
        feat_name = feature_names[idx]
        contr = vals[idx]
        if task_type == 'regression':
            direction = "INCREASES predicted value" if contr > 0 else "DECREASES predicted value"
        else:
            direction = "INCREASED Risk/Likelihood" if contr > 0 else "DECREASED Risk/Likelihood"
        summary.append(f"- {feat_name}: {direction} (Impact magnitude: {abs(contr):.4f})")
        
    return "\n".join(summary)
