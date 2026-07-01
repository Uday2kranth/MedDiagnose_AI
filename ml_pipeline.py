import pandas as pd
import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder, LabelEncoder
from xgboost import XGBClassifier, XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, r2_score, mean_absolute_error, mean_squared_error


def detect_task_type(y: pd.Series, threshold: int = 15) -> str:
    """
    Auto-detect whether the target is classification or regression.
    
    Rules:
    - If dtype is object/category/bool → classification
    - If dtype is numeric and unique count <= threshold → classification
    - Otherwise → regression
    """
    if y.dtype == 'object' or y.dtype.name == 'category' or y.dtype == 'bool':
        return 'classification'
    
    n_unique = y.nunique()
    if n_unique <= threshold:
        return 'classification'
    
    return 'regression'


def train_model(df: pd.DataFrame, target_col: str, feature_cols: list):
    """
    Trains a robust XGBoost pipeline.
    Auto-detects classification vs regression based on target column.
    
    Returns:
        pipeline, label_encoder (or None), metrics_dict, X_train, task_type
    """
    X = df[feature_cols]
    y = df[target_col]
    
    task_type = detect_task_type(y)
    
    # Identify feature types
    numeric_features = X.select_dtypes(include=['int64', 'float64', 'int32', 'float32']).columns.tolist()
    categorical_features = X.select_dtypes(exclude=['int64', 'float64', 'int32', 'float32']).columns.tolist()
    
    # Preprocessing
    numeric_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='constant', fill_value='Unknown')),
        ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', numeric_transformer, numeric_features),
            ('cat', categorical_transformer, categorical_features)
        ]
    )
    
    # Choose model based on task type
    if task_type == 'classification':
        le = LabelEncoder()
        y_encoded = le.fit_transform(y)
        
        model = XGBClassifier(
            n_estimators=100,
            random_state=42,
            eval_metric='logloss'
        )
        
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', model)
        ])
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_encoded, test_size=0.2, random_state=42
        )
        pipeline.fit(X_train, y_train)
        
        prediction = pipeline.predict(X_test)
        acc = accuracy_score(y_test, prediction)
        
        metrics = {
            'accuracy': float(acc),
            'samples': int(len(df)),
            'features': int(len(feature_cols)),
            'task_type': 'classification',
            'n_classes': int(len(le.classes_))
        }
        
        return pipeline, le, metrics, X_train, task_type
    
    else:
        # Regression
        le = None
        y_values = y.astype(float).values
        
        model = XGBRegressor(
            n_estimators=100,
            random_state=42,
            eval_metric='rmse'
        )
        
        pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('regressor', model)
        ])
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_values, test_size=0.2, random_state=42
        )
        pipeline.fit(X_train, y_train)
        
        prediction = pipeline.predict(X_test)
        r2 = r2_score(y_test, prediction)
        mae = mean_absolute_error(y_test, prediction)
        rmse = float(np.sqrt(mean_squared_error(y_test, prediction)))
        
        metrics = {
            'r2': float(r2),
            'mae': float(mae),
            'rmse': float(rmse),
            'samples': int(len(df)),
            'features': int(len(feature_cols)),
            'task_type': 'regression'
        }
        
        return pipeline, le, metrics, X_train, task_type
