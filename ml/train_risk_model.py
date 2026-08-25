import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import json
import os

# This script trains a machine learning model to predict the "Risk Level" of a drone flight
# based on its telemetry data (max altitude, total distance, average battery drain).
# The dataset simulates a typical Kaggle drone telemetry dataset.

def generate_synthetic_dataset(filename="drone_telemetry_dataset.csv"):
    """Generates a synthetic dataset for training if one doesn't exist."""
    np.random.seed(42)
    n_samples = 1000
    
    max_altitudes = np.random.normal(120, 30, n_samples) # meters
    avg_speeds = np.random.normal(15, 5, n_samples) # m/s
    flight_durations = np.random.normal(25, 10, n_samples) # minutes
    battery_drains = (flight_durations * 0.5) + np.random.normal(0, 5, n_samples) + (max_altitudes * 0.1)
    
    # Calculate Risk Label based on physical thresholds
    # 0 = Low Risk, 1 = High Risk
    risk_labels = []
    for i in range(n_samples):
        if max_altitudes[i] > 150 or battery_drains[i] > 80 or avg_speeds[i] > 25:
            risk_labels.append(1)
        else:
            # Random chance for other factors
            risk_labels.append(np.random.choice([0, 1], p=[0.9, 0.1]))
            
    df = pd.DataFrame({
        'max_altitude': max_altitudes,
        'avg_speed': avg_speeds,
        'flight_duration': flight_durations,
        'battery_drain': battery_drains,
        'risk_label': risk_labels
    })
    
    df.to_csv(filename, index=False)
    print(f"Dataset generated and saved to {filename}")
    return filename

def train_model():
    dataset_file = "drone_telemetry_dataset.csv"
    if not os.path.exists(dataset_file):
        generate_synthetic_dataset(dataset_file)
        
    df = pd.read_csv(dataset_file)
    
    X = df[['max_altitude', 'avg_speed', 'flight_duration', 'battery_drain']]
    y = df['risk_label']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train a Random Forest Classifier
    clf = RandomForestClassifier(n_estimators=10, max_depth=3, random_state=42)
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    print("Accuracy:", accuracy_score(y_test, y_pred))
    print("Classification Report:\n", classification_report(y_test, y_pred))
    
    # Export the model (Simplified for JS integration)
    # We will export the thresholds of the first tree as a simple decision tree
    # For a full production system we would use ONNX or a Python microservice, 
    # but to integrate without Python backend dependencies, we export tree rules.
    
    tree = clf.estimators_[0].tree_
    
    model_data = {
        'feature_names': ['max_altitude', 'avg_speed', 'flight_duration', 'battery_drain'],
        'tree': {
            'children_left': tree.children_left.tolist(),
            'children_right': tree.children_right.tolist(),
            'feature': tree.feature.tolist(),
            'threshold': tree.threshold.tolist(),
            'value': tree.value.tolist()
        }
    }
    
    os.makedirs('../backend/src/ml_models', exist_ok=True)
    with open('../backend/src/ml_models/risk_model.json', 'w') as f:
        json.dump(model_data, f)
        
    print("Model exported to ../backend/src/ml_models/risk_model.json")

if __name__ == "__main__":
    train_model()
